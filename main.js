var _URL = window.URL || window.webkitURL;

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.')
}



/*
 *     ____  ____   __  ____    ____  __  __    ____
 *    (    \(  _ \ /  \(  _ \  (  __)(  )(  )  (  __)
 *     ) D ( )   /(  O )) __/   ) _)  )( / (_/\ ) _)
 *    (____/(__\_) \__/(__)    (__)  (__)\____/(____)
 *
 */
var currentFile;

function handleFileSelect(e) {
    // Prevent default behavior (Prevent file from being opened)
    e.stopPropagation()
    e.preventDefault()

    var files = e.dataTransfer.files; // FileList object.

    // files is a FileList of File objects
    for (var file of files) {
        // Only process image files.
        if (!file.type.match('image.*')) {
            continue
        }

        //
        // Transform the image with DroneTracer
        //        

        currentFile = file;
        generate();
        document.getElementById('original_image').src = _URL.createObjectURL(file);
    }
}

function generate() {
    if(!currentFile) {
        alert('No file selected yet, please drag one into the zone')
        return;
    }

    var amount = document.getElementById('amount').value;
    for(var i = 0; i < amount; i++) {
        tracerTransform(currentFile);
    }
}

function handleDragOver(e) {
    // Prevent default behavior (Prevent file from being opened)
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy
}


// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone')
dropZone.addEventListener('dragover', handleDragOver, false)
dropZone.addEventListener('drop', handleFileSelect, false)

//
// UI
//
var block = document.getElementsByClassName('generated_block')[0]
// block.style.display = "none";
// var display_zone = document.getElementById('display_zone')

document.querySelectorAll('input[type=range]').forEach((el)=>{
    el.oninput = function(e) {
        e.srcElement.setAttribute('value', this.value)
    }
})

/*
 *     ____  ____   __   __ _  ____  ____  ____   __    ___  ____  ____
 *    (    \(  _ \ /  \ (  ( \(  __)(_  _)(  _ \ / _\  / __)(  __)(  _ \
 *     ) D ( )   /(  O )/    / ) _)   )(   )   //    \( (__  ) _)  )   /
 *    (____/(__\_) \__/ \_)__)(____) (__) (__\_)\_/\_/ \___)(____)(__\_)
 *
 */
// Painting wall configuration
var paintingConfig = {
    wallId: 'CT19-001',		// required | ID to identify the wall target
    gpsLocation: [0,0],		// required | wall GPS coordinates [Latitude, Longitude]
    wallSize: [33000, 50000],	// required | wall width [mm], wall height [mm] (33m x 50m)
    canvasSize: [33000, 10000],	// required | canvas area size [mm] (33m x 10m)
    canvasPosition: [0,10000],	// required | relative position of the canvas in the wall [mm]
    colors: ['#000000'],		// list of available colors
    strokeWeight: 100,		// drone paint stroke thickness [mm]
    droneResolution: 200,		// drone resolution [mm]
    dronePrecisionError: 150,	// drone positioning error margin [mm]
    droneFlyingSpeed: 0.6,	// average drone flying speed [m/s]
    droneFlightTime: 240000,	// duration of battery flying [ms]
    droneDrawingTime: 84000,	// average continuous drawing time [ms]
    droneSwapTime: 300000,	// land, swap battery and paint can, takeoff, and resume painting [ms]
    droneTakeoffTime: 140000,	// max duration from drone takeoff to actual painting [ms]
    droneLandingTime: 90000,	// max time needed to stop painting and land [ms]
    minimumImageSize: [350,350], // Min image size to be accepted
}

var tracer = new DroneTracer(paintingConfig)
var uiParameters = tracer.uiParameters

function tracerTransform(imagefile) {
    var blurRadius = getRandomInt(1, 10); //Default 4
    var treshold = getRandomInt(1, 100); //Default 50

    var colorTreshold = getRandomInt(0, 100) //Default 45
    var strokeWeight = getRandomInt(1, 20) //Default 4

    var cl = document.getElementById('checkbox_centerline').checked;

    var start = window.performance.now();
    tracer.transform(
      imagefile, // loaded File API
      (progress) => {
          var progressStatus = parseFloat(progress*100)
          console.log(`progress ${progressStatus}%`)
      }, // log progress
      {
        blurKernel: blurRadius,
        hysteresisHighThreshold: treshold,
        binaryTreshold: colorTreshold,
        dilationRadius: strokeWeight,

        centerline: cl
        // drone: {
        //     minimunDistance: 10
        // }
      }
    ).then( (dronePaint) => {
        var end = window.performance.now();
        var trace_time = ((end - start) / 1000.0).toFixed(2);

        
        var new_block = block.cloneNode(true);
        var new_preview = new_block.getElementsByClassName('preview_zone')[0];
        var new_display = new_block.getElementsByTagName('span')[0];

        new_preview.innerHTML = dronePaint.svgFile
        new_preview.children[0].style.width = '100%'
        new_preview.children[0].style.height = '100%'

        new_block.onclick = function() {            
            fallbackCopyTextToClipboard(dronePaint.svg)
            alert('SVG copied to clipboard.')
        }
        
        // var total_distance = (dronePaint.counts.painting + dronePaint.counts.flying) / 1000.0;
        // var total_time = total_distance * 2.0;

        // var td_fixed = (total_distance).toFixed(2);
        // var pd_fixed = (dronePaint.counts.painting / 1000.0).toFixed(2);
        // var time_fixed = new Date(1000 * total_time).toISOString().substr(11, 8)

        var time = new Date(dronePaint.estimatedTime).toISOString().substr(11, 8);

        if(cl) {
            new_display.innerText = `Color treshold: ${colorTreshold} \n Stroke weight: ${strokeWeight}`            
        } else {
            new_display.innerText = `Blur Radius: ${blurRadius} \n Treshold: ${treshold}`
        }
        
        new_display.innerText += '\n \n';
        new_display.innerText += `Trace time: ${trace_time}s \n`            
        // new_display.innerText += `Paint distance: ${pd_fixed}m \n Paint + Fly Distance: ${td_fixed}m \n Flying time (0.5m/sec): ${time_fixed}`;        
        new_display.innerText += `Estimated Painting time: ${time} \n`
        
        var canSwipes = Math.floor(dronePaint.estimations.paintingTime/dronePaint.paintingConfig.droneDrawingTime)        
        new_display.innerText += `Can swipes: ${canSwipes} \n`

        var batterySwipes = Math.floor(dronePaint.estimations.flyingTime/dronePaint.paintingConfig.droneFlightTime)
        new_display.innerText += `Battery swipes: ${batterySwipes} \n`

        new_block.style.display = "block";
        block.parentNode.appendChild(new_block);
    });

}
