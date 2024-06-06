const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

async function analyzeContent(filePath, callback){
    let previousFrame; // frame before?
    let flashDetected = false;

    ffmpeg(filePath)
    .on('error', (err) => {
        console.error('an error occured'+ err.message );
        callback(err, null);
    })
    .on('end', () =>{
        console.log('processing is finished');
        callback(null,flashDetected);
    })
    .screenshots({
        count: 10, // num of frames to check
        folder: path.join(__dirname, 'frames'),
        size: '320x240',
        filename: 'frame-%i.png'
    })
    .on('filename', (filenames) =>{
        const framePath = path.join(__dirname, 'frames', filename);
        const currentFrame = fs.readFileSync(framePath);

        if(previousFrame){
            const difference = calculateFrameDifference(previousFrame, currentFrame);
            if(difference > 50){ // maybe change this but its just for testing?
                falseDetected = true;
            }
        }

        previousFrame = currentFrame;

        //cleanup
        fs.unlickSync(framePath);

    })


}

// calculate the diff between the two frames
function calculateFrameDifference(frame1, frame2){
    // diff caluclation pixel wise
    const length = Math.min(frame1.length, frame2.length);
    let difference = 0;

    for(let i = 0; i < length; i++){
        difference += Math.abs(frame1[i] - frame2[i]);
    }

    return different/length;
}

module.exports = analyzeContent;