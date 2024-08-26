const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const { timeStamp } = require('console');

// ffmpeg configuration
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// calculate brightness difference between two frames using sharp
async function calculateBrightnessDifference(frame1Path, frame2Path) {

    const [frame1, frame2] = await Promise.all([ // promise all to await both frames to be processed
        sharp(frame1Path).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), // get alpha to compare brightness
        sharp(frame2Path).ensureAlpha().raw().toBuffer({ resolveWithObject: true }) // get alpha to compare brightness
    ]);

    const { data: data1, info: info1 } = frame1; // extract data and info from frame1
    const { data: data2, info: info2 } = frame2; // extract data and info from frame2

    let difference = 0;  // init difference to 0
    const length = Math.min(data1.length, data2.length); // get the minimum length of data1 and data2

    for (let i = 0; i < length; i += info1.channels) {
        const brightness1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2]; // calculate brightness of pixel in frame1
        const brightness2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2]; // calculate brightness of pixel in frame2
        difference += Math.abs(brightness1 - brightness2); // calculate difference between brightness of pixels for both frames using absolute value
        // a higher difference indicates a significant change in brightness between frames
        // a lower difference indicates a minor change in brightness between frames
            // therefore, the higher difference could mean that a flash has occurred in the video
            // and on the otherhand a lower difference could mean that there is no flash in the video
            // this is then used below to determine significant changes in the video of flashes
        }

    const avgDifference = difference / (length / info1.channels); // normalize by number of pixels
    return avgDifference; // return average difference
}

// calculate variance of an array
function calculateVariance(data) {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length; // calculate mean of data array using reduce method
    const variance = data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / data.length; // calculate variance using reduce method
    return variance; // return variance
}

async function checkContent(filePath, callback) {
    let previousFramePath; // to store the previous frame path
    let flashDetected = false; // flag to indicate if a flash is detected
    const frameDifferences = []; // array to store frame differences
    const significantChanges = []; // array to store significant changes

    // ensure the frames directory exists
    const framesDir = path.join(__dirname, 'frames');
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir);
    }

    let filenames = []; // define filenames array here

    const isGIF = filePath.endsWith('.gif'); // check if the file is a gif

    if(isGIF){ 
        console.log('gif detected');
    } // returns correctly? 

    // extract frames from the video file
    const ffmpegCommand = ffmpeg(filePath)
        .on('start', (commandLine) => { // event listener for start, no console output
            // log the command line used to spawn ffmpeg
            console.log('spawned ffmpeg, type: ', isGIF ? 'gif':'video');
        })
        .on('error', (err) => {
            // log error if an error occurred
            console.error('an error occurred: ' + err.message);
            callback(err, null); // callback with error 
        })
        .on('end', async () => {
            // log processing is finished
            const variance = calculateVariance(frameDifferences);
            const significantChangeCount = significantChanges.length; // count of significant changes in the video
            
            // logging the results
            console.log('processing is finished');
            console.log('frame differences:', frameDifferences);
            console.log('variance of differences:', variance);
            console.log('significant changes:', significantChangeCount);

            // adjusted logic to detect flash based on variance, significant changes, and average difference
            if (variance > 250 || significantChangeCount > 100) { // threshold for significant changes or variance
                flashDetected = true;
                // todo: make a variable for these thresholds
                // changed the variance and significant change thresholds to 250 and 100 respectively
                // then a flash is detected in the video, a significant change could indicate a flash in the video aswell,
                // meaning there have been more than 10 significant changes in the video which could indicate a video that is bad
                // for epileptic people
            }
            
            const resultData = {
                frameDifferences,
                variance,
                significantChangeCount,
                significantChangeCount,
                flashDetected,
                timeStamp: new Date().toISOString()
            }

            fs.writeFileSync(path.join(__dirname, 'verdictlogs','result.json'), JSON.stringify(resultData, null, 2));

            callback(null, flashDetected);

            // cleanup
            filenames.forEach((filename) => {
                const framePath = path.join(framesDir, filename);
                if (fs.existsSync(framePath)) {
                    try {
                        fs.unlinkSync(framePath);
                    } catch (error) {
                        console.error(`failed to delete frame: ${framePath}`, error);
                    }
                }
            });
        })

        if(isGIF){
            ffmpegCommand.inputOptions(['-t 10', '-r 10']) // added input options for gifs to limit duration and frame rate
            .screenshots({
                count: 50, // less for gifs 
                folder: framesDir, // directory to save frames
                size: '320x240', // size of frames
                filename: 'frame-%i.png' // name convention for frames
            })
        } else {
            // saved frames
            ffmpegCommand.screenshots({
                count: 100, // increased number of frames to capture more data
                folder: framesDir, // directory to save frames
                size: '320x240', // size of frames
                filename: 'frame-%i.png' // name convention for frames
            })
        }

        ffmpegCommand.on('filenames', (generatedFilenames) => { // event listener for filenames
            filenames = generatedFilenames; // save generated filenames
            console.log('generated filenames:', filenames); // log generated filenames

            // add a delay to ensure files are written before reading
            setTimeout(async () => { // added setTimeout to ensure files are written before reading
                for (let i = 0; i < filenames.length; i++) { // iterate over filenames
                    const filename = filenames[i];
                    const framePath = path.join(framesDir, filename);

                    // Check if the frame file exists before processing
                    if (fs.existsSync(framePath)) {
                        // calculate difference if previous frame exists
                        if (previousFramePath) {
                            // calculate brightness difference between frames using function
                            const difference = await calculateBrightnessDifference(previousFramePath, framePath);
                            frameDifferences.push(difference);

                            // significant change threshold
                            if (difference > 10) { // threshold for significant change
                                significantChanges.push(difference);
                            }

                            // cleanup previous frame file
                            if (fs.existsSync(previousFramePath)) {
                                try { // try to delete previous frame file
                                    fs.unlinkSync(previousFramePath);
                                } catch (error) { // error handle
                                    console.error(`failed to delete frame: ${previousFramePath}`, error);
                                }
                            }
                        }
                        previousFramePath = framePath;
                    } else {
                        // log warning if frame file not found
                        console.warn(`frame file not found: ${framePath}`);
                    }
                }
            }, 500); // delay
        });
}

module.exports = checkContent;