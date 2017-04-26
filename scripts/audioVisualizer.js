(function () {
    "use strict";
    window.onload = init; //Call init when the window loads

    //Canvas
    var canvas; //The canvas
    var ctx; //Canvas context
    
    //Audio
    var NUM_SAMPLES = 256;
    var SOUND_1 = 'media/Big Hands by Silent Partner.mp3';
    var SOUND_2 = 'media/Lurking by Silent Partner.mp3';
    var audioElement; //The audio element on the page
    var analyserNode;
    var fadeCount = 1;
    //Audio from https://www.youtube.com/audiolibrary/music
    //Big Hands – Silent Partner
    //Lurking – Silent Partner

    
    //Effects
    var scheme = "lime";
    var frequency = false;
    var waveform = false;
    var bars;
    var invert = false;
    var noise = false;
    var delayNode; //Delay
    var compressionNode; //Compressor
    var startTimer;
    var titleFade = 1;
    var d;
    var tintRed;
    var tintBlue;
    var tintGreen;

    //Initialization function
    function init() {
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");
        
        audioElement = document.querySelector("audio"); //Get a reference to the audio element on the page
        audioElement.volume = .2;
        
        analyserNode = createWebAudioContextWithAnalyserNode(audioElement); //Create an analyser node
                
        //Choose the default visualization
        var barChoice = Math.floor(Math.random() * 5); //0-4
        if (barChoice == 0) {
            bars = "sides";
        }
        else if (barChoice == 1) {
            bars = "middle";
        }
        else if (barChoice == 2) {
            bars = "circle";
        }
        else if (barChoice == 3) {
            bars = "curves";
        }
        else if (barChoice == 4) {
            bars = "all";
        }
        document.querySelector("#bars").value = bars;

        //Choose the default visualization
        var themeChoice = Math.floor(Math.random() * 4); //0-3
        if (themeChoice == 0) {
            scheme = "lime";
        }
        else if (themeChoice == 1) {
            scheme = "tvTest";
        }
        else if (themeChoice == 2) {
            scheme = "tvTestFade";
        }
        else if (themeChoice == 3) {
            scheme = "gradient";
        }
        document.querySelector("#schemeSelect").value = scheme;
        
        //Choose the default sound format
        var formChoice = Math.floor(Math.random() * 2); //0-1  
        if (formChoice == 0) {
            frequency = true;
            document.querySelector("#freq").checked = frequency;
        }
        else if (formChoice == 1) {
            waveform = true;
            document.querySelector("#wave").checked = waveform;
        }
        
        //Load and play the default sound
        var songChoice = Math.floor(Math.random() * 2); //0-1 
        if (songChoice == 0) {
            playStream(audioElement, SOUND_1);
            document.querySelector("#trackSelect").value = SOUND_1;
        }
        else if (songChoice == 1) {
            playStream(audioElement, SOUND_2);
            document.querySelector("#trackSelect").value = SOUND_2;
        }
        
        visualizerUI(); //Visualizer UI setup
        canvasInteraction(); //Can interact with the canvas
        update(); //Start the animation loop
    }
    
    //Create an analyser node
    function createWebAudioContextWithAnalyserNode(audioElement) {
        var audioCtx; //Audio context
        var analyserNode;
        var sourceNode;
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext); //Create new AudioContext if supported

        analyserNode = audioCtx.createAnalyser(); //Create an analyser node

        analyserNode.fftSize = NUM_SAMPLES; //Fast Fourier Transform size
        
        //Create a DelayNode instance
        delayNode = audioCtx.createDelay();
        delayNode.delayTime.value = 0;
        
        //Create a Compressor
        compressionNode = audioCtx.createDynamicsCompressor();
        compressionNode.threshold.value = -50;
        compressionNode.knee.value = 40;
        compressionNode.ratio.value = 12;
        compressionNode.attack.value = 0;
        compressionNode.release.value = .25;

        //Hook up the audio element to the analyserNode
        sourceNode = audioCtx.createMediaElementSource(audioElement);
        
        //Unaltered source
        sourceNode.connect(audioCtx.destination); //Connect the sourceNode to the speakers
        
        //Modified source
        sourceNode.connect(delayNode); //Hook up the sourceNode to the delayNode
        delayNode.connect(compressionNode); //Hook up the delayNode to the compressionNode
        compressionNode.connect(analyserNode); //Hook up the compressionNode to the analyyserNode
        analyserNode.connect(audioCtx.destination); //Connect the analyserNode to the speakers
        
        return analyserNode;
    }

    //Visualizer UI setup
    function visualizerUI() {
        //Dropdown selectors
        document.querySelector("#trackSelect").onchange = function(e) {
            if (e.target.value != "custom")
                playStream(audioElement,e.target.value);
        };
        
        document.querySelector("#schemeSelect").onchange = function(e) {
            scheme = e.target.value;
        };
        document.querySelector("#bars").onchange = function(e) {
            bars = e.target.value;
        };
        
        //Radio buttons
        document.querySelector("#freq").onchange = function(e) {
            frequency = e.target.checked;
            waveform = false;
        };
        document.querySelector("#wave").onchange = function(e) {
            waveform = e.target.checked;
            frequency = false;
        };
        
        //Checkboxes
        document.querySelector("#invert").onchange = function(e) {
            invert = e.target.checked;
        };
        document.querySelector("#noise").onchange = function(e) {
            noise = e.target.checked;
        };
        document.querySelector("#tintRed").onchange = function(e) {
            tintRed = e.target.checked;
        };
        document.querySelector("#tintBlue").onchange = function(e) {
            tintBlue = e.target.checked;
        };
        document.querySelector("#tintGreen").onchange = function(e) {
            tintGreen = e.target.checked;
        };

        //Sliders
        document.querySelector("#delaySlider").onchange = function(e) {
            delayNode.delayTime.value = e.target.value;
        };
        document.querySelector("#thresholdSlider").onchange = function(e) {
            compressionNode.threshold.value = e.target.value;
        };
        document.querySelector("#kneeSlider").onchange = function(e) {
            compressionNode.knee.value = e.target.value;
        };
        document.querySelector("#ratioSlider").onchange = function(e) {
            compressionNode.ratio.value = e.target.value;
        };
        document.querySelector("#attackSlider").onchange = function(e) {
            compressionNode.attack.value = e.target.value;
        };
        document.querySelector("#releaseSlider").onchange = function(e) {
            compressionNode.release.value = e.target.value;
        };
        
        //Fullscreen
        document.querySelector("#fsButton").onclick = function() {
            requestFullscreen(canvas);
        };
    }

    //Playing sound
    function playStream(audioElement,path) {
        audioElement.src = path;
        audioElement.play();
        d = new Date();
        startTimer = d.getTime() / 1000;
        titleFade = 1;
        document.querySelector('#status').style.opacity = titleFade;
        document.querySelector('#status').innerHTML = "Now playing:<br>" + path.substring(path.indexOf("/") + 1, path.indexOf(".")); //Append string
    }
    
    //Playing audio files that have been dragged in
    function playStreamFromDrag(audioElement,path,fname) {
        audioElement.src = path;
        audioElement.play();
        d = new Date();
        startTimer = d.getTime() / 1000;
        titleFade = 1;
        document.querySelector('#status').style.opacity = titleFade;
        document.querySelector('#status').innerHTML = "Now playing:<br>" + fname.substring(0, fname.indexOf("."));
    }

    //Update audio visualizer
    function update() {
        canvas.width = document.body.clientWidth; //Dynamically adjust the size of the canvas
        audioElement.style.width = document.body.clientWidth + "px"; //Dynamically adjust the size of the controls
        requestAnimationFrame(update); //Update the animation frame 60 times a second
        var data = new Uint8Array(NUM_SAMPLES / 2); //0-255, Nyquist theorem?
        
        if (frequency)
            analyserNode.getByteFrequencyData(data); //Populate the arrays with frequency data
        if (waveform)
            analyserNode.getByteTimeDomainData(data); //Populate the arrays with waveform data

        ctx.clearRect(0, 0, canvas.width, canvas.height); //Clear the canvas
        var barWidth = 4;
        
        d = new Date();
        //Fade out song title
        if ((d.getTime() / 1000) - startTimer > 5) {
            titleFade -= .017;
                        
            if (titleFade < 0)
                titleFade = 0;
            
            document.querySelector('#status').style.opacity = titleFade;
        }
        
        //Fade in/out on pause
        if (audioElement.paused) {
            fadeCount -= .017;
            
            if (fadeCount < 0)
                fadeCount = 0;
            
            ctx.globalAlpha = fadeCount;
        }
        else if (!audioElement.paused) {
            fadeCount += .017;
            
            if (fadeCount > 1)
                fadeCount = 1;
            
            ctx.globalAlpha = fadeCount;
        }
        
        if (ctx.globalAlpha > 0)
            //Loop through the data to draw
            for(var i = 0; i < data.length; i++) {
                //Scheme
                if (scheme == "lime") {
                    ctx.strokeStyle = "lime";
                    ctx.fillStyle = "lime";
                }
                else if (scheme == "tvTest") {
                    ctx.strokeStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 1); 
                    ctx.fillStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), 1);
                }
                else if (scheme == "tvTestFade" && i < data.length / 2) {
                    ctx.strokeStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), i / data.length); 
                    ctx.fillStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), i / data.length);
                }
                else if (scheme == "tvTestFade" && i > data.length / 2) {
                    ctx.strokeStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.abs(i - data.length) / data.length); 
                    ctx.fillStyle = makeColor(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.abs(i - data.length) / data.length);
                }
                else if (scheme == "gradient") {
                    var grad = ctx.createLinearGradient(0, 0, 0, 500);

			        grad.addColorStop(0, "red");
			        grad.addColorStop(.17, "orange");
			        grad.addColorStop(.34, "yellow");
                    grad.addColorStop(.5, "green");
                    grad.addColorStop(.67, "blue");
                    grad.addColorStop(.84, "indigo");
                    grad.addColorStop(1, "violet");

			        ctx.strokeStyle = grad;
                    ctx.fillStyle = grad;
                }
                
                //Draw the lineform
                if (bars == "middle" || bars == "all") {
                    ctx.save();
                    ctx.translate(0, canvas.height / 2);
                    ctx.fillRect(i * (canvas.width / data.length), (data.length - data[i]) / 4, canvas.width / (data.length * 4), (data.length - data[i]) / 4);
                    ctx.restore();
                }
                
                //Draw rectangles on the left and right of the screen
                if (bars == "sides" || bars == "all") {
                    if (i % 2 == 0) {
                        ctx.fillRect(0, i * (barWidth), (canvas.width / 4) - data[i], barWidth);
                    }
                    else {
                        ctx.fillRect(canvas.width, (i - 1) * (barWidth), -(canvas.width / 4) + data[i], barWidth);
                    }
                }
                
                //Draw the circle
                if (bars == "circle" || bars == "all") {
                    var circleRadius = (data[i] / 255) * 200;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.closePath();
                    
                    circleRadius = (data[i] / 255) * 50;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 3.5, canvas.height / 2, circleRadius, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.closePath();
                    
                    ctx.beginPath();
                    ctx.arc(canvas.width - (canvas.width / 3.5), canvas.height / 2, circleRadius, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    ctx.closePath();
                }
                
                //Draw the curves
                if (bars == "curves" || bars == "all") {
                    ctx.save();
                    ctx.translate(canvas.width / 4, 0);    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(canvas.width / 4, (canvas.height / 4) - data[i], canvas.width / 2, 0);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, canvas.height);
                    ctx.bezierCurveTo(canvas.width / 4, (canvas.height * 2) - data[i], canvas.width / 4, (canvas.height) - data[i], canvas.width / 2, canvas.height);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, canvas.height);
                    ctx.bezierCurveTo(canvas.width / 4, (canvas.height) - data[i], canvas.width / 4, (canvas.height * 2) - data[i], canvas.width / 2, canvas.height);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        
        manipulatePixels();
    }
    
    //For checkboxes that alter the look of the audio visualizer
    function manipulatePixels() {
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); //getImageData object

        var data = imageData.data; //1024000 pixels
        var length = data.length;
        var width = imageData.width;

        //data[i] is the red value
        //data[i + 1] is the green value
        //data[i + 2] is the blue value
        //data[i + 3] is the alpha value
        for (var i = 0; i < length; i += 4) {      
            if (tintRed)                    
                    data[i] = data[i] + 100;
            if (tintBlue)                    
                    data[i] = data[i + 1] + 100;
            if (tintGreen)                    
                    data[i] = data[i + 2] + 100;
            
            //Invert all color channels
            if (invert) {
                var red = data[i], green = data[i + 1], blue = data[i + 2];
                data[i] = 255 - red; //Set red value
                data[i + 1] = 255 - green; //Set green value
                data[i + 2] = 255 - blue; //Set blue value
            }

            //Make noise
            if (noise && Math.random() < .01) {
                data[i] = data[i + 1] = data[1 + 2] = data[i + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0); //Draw image data on the canvas
    }

    //String concatenation to make colors
    function makeColor(red, green, blue, alpha) {
        var color = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
        return color;
    }

    //Make the audio visualizer fullscreen if it is supported
    function requestFullscreen(element) {
        if (element.requestFullscreen)
            element.requestFullscreen();
        else if (element.mozRequestFullscreen)
            element.mozRequestFullscreen();
        else if (element.mozRequestFullScreen) //Camel-cased 'S' was changed to 's' in spec
            element.mozRequestFullScreen();
        else if (element.webkitRequestFullscreen)
            element.webkitRequestFullscreen();
    }
    
    //Mouse interaction with the canvas
    function canvasInteraction() {
        //If the canvas is clicked on to pause
        document.querySelector("#canvas").onclick = function(e) {
            if (!audioElement.paused) {
                audioElement.pause();
            }
            else if(audioElement.paused) {
                audioElement.play();
            }
        };
        
        //Disables default behaviors allowing for drop
        window.ondragover = function (e) {
            e.preventDefault();
        };
        
        //Allows for audio to be dropped onto the window
        window.ondrop = function (e) {
            e.preventDefault(); //Stop the default behavior
            
            if (e.dataTransfer.files[0].type.includes("audio")) {
                playStreamFromDrag(audioElement, URL.createObjectURL(e.dataTransfer.files[0]), e.dataTransfer.files[0].name);
                document.querySelector("#trackSelect").value = "custom";
            }
        }
    }
}());