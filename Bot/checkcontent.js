const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// calculate brightness difference between two frames
function calculateBrightnessDifference(frame1, frame2) {
    const length = Math.min(frame1.length, frame2.length);
    let difference = 0;

    for (let i = 0; i < length; i += 4) { // assuming RGBA values
        const brightness1 = (0.299 * frame1[i] + 0.587 * frame1[i + 1] + 0.114 * frame1[i + 2]);
        const brightness2 = (0.299 * frame2[i] + 0.587 * frame2[i + 1] + 0.114 * frame2[i + 2]);
        difference += Math.abs(brightness1 - brightness2);
    }

    const avgDifference = difference / (length / 4); // normalize by number of pixels
    console.log('average brightness difference:', avgDifference);
    return avgDifference;
}

// calculate variance of an array
function calculateVariance(data) {
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / data.length;
    return variance;
}

async function checkContent(filePath, callback) {
    let previousFrame; // to store the previous frame data
    let flashDetected = false; // flag to indicate if a flash is detected
    const frameDifferences = []; // array to store frame differences
    const significantChanges = []; // array to store significant changes

    // ensure the frames directory exists
    const framesDir = path.join(__dirname, 'frames');
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir);
    }

    // extract frames from the video file
    ffmpeg(filePath)
        .on('start', (commandLine) => {
            console.log('spawned ffmpeg with command: ' + commandLine);
        })
        .on('error', (err) => {
            console.error('an error occurred: ' + err.message);
            callback(err, null);
        })
        .on('end', () => {
            const variance = calculateVariance(frameDifferences);
            const significantChangeCount = significantChanges.length;
            console.log('processing is finished');
            console.log('frame differences:', frameDifferences);
            console.log('variance of differences:', variance);
            console.log('significant changes:', significantChangeCount);

            // adjusted logic to detect flash based on variance, significant changes, and average difference
            if (variance > 5 || significantChangeCount > 10) { // increased threshold for significant changes
                flashDetected = true;
            }
            callback(null, flashDetected);
        })
        .screenshots({
            count: 100, // increased number of frames to capture more data
            folder: framesDir,
            size: '320x240',
            filename: 'frame-%i.png'
        })
        .on('filenames', (filenames) => {
            console.log('generated filenames:', filenames); // log generated filenames
            
            // add a delay to ensure files are written before reading
            setTimeout(() => {
                filenames.forEach((filename, index) => {
                    const framePath = path.join(framesDir, filename);
                    if (fs.existsSync(framePath)) {
                        const currentFrame = fs.readFileSync(framePath);

                        // calculate difference if previous frame exists
                        if (previousFrame) {
                            const difference = calculateBrightnessDifference(previousFrame, currentFrame);
                            frameDifferences.push(difference);

                            if (difference > 10) { // threshold for significant change
                                significantChanges.push(difference);
                            }
                        }
                        previousFrame = currentFrame;

                        // cleanup frame files
                        try {
                            fs.unlinkSync(framePath);
                        } catch (error) {
                            console.error(`failed to delete frame: ${framePath}`, error);
                        }
                    } else {
                        console.error(`frame not found: ${framePath}`);
                    }
                });
            }, 500); // adjust delay as needed
        });
}

module.exports = checkContent;