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
block.style.display = "none";
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
  wallId: 1,
  gpsLocation: [-99.134982,19.413494],
  dimensions: [30.4, 22.07],
  colors: ['#000000', '#eb340f', '#0f71eb'], // default [#000]
  droneResolution: 0.1, // default 0.2
}

var timer_id = 0
// Instance of a drone tracer
var tracer = new DroneTracer(paintingConfig)

function tracerTransform(imagefile) {

    var bk = getRandomInt(1, 8)*1.0;
    var hht = getRandomInt(1, 100) * 1.0;
    var hlt = getRandomInt(1, hht) * 1.0;
    var cclf = getRandomInt(0, 100) * 1.0;
    var tft = getRandomInt(0, 50) / 10.0;
    var dr = getRandomInt(1, 20) * 1.0;

    var cl = document.getElementById('checkbox_centerline').checked;
    timer_id++;
    var start = window.performance.now();
    // Transform image into a flyable drone path
    tracer.transform(
      imagefile, // loaded File API
      (progress) => {
          var progressStatus = parseFloat(progress*100)
          console.log(`progress ${progressStatus}%`)
      }, // log progress
      {
        //random 1 8 3  
        blurKernel: bk,
        //random 1 100 60
        hysteresisHighThreshold: hht,
        //random 1 hysteresisHighThreshold 10
        hysteresisLowThreshold: hlt,
        //random 0 100 2
        contrastConcatLengthFactor: cclf,
        //random 0 50 12 smooth
        traceFilterTolerance: tft,
        //random 1 20 4
        dilationRadius: dr,

        centerline: cl,
        drone: {
            minimunDistance: 10
        }
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
        
        var total_distance = (dronePaint.counts.painting + dronePaint.counts.flying) / 1000.0;
        var total_time = total_distance * 2.0;

        var td_fixed = (total_distance).toFixed(2);
        var pd_fixed = (dronePaint.counts.painting / 1000.0).toFixed(2);
        var time_fixed = new Date(1000 * total_time).toISOString().substr(11, 8)

        if(cl) {
            new_display.innerText = `traceFilterTolerance: ${tft} \n dilationRadius: ${dr}`            
        } else {
            new_display.innerText = `blurKernel: ${bk} \n hysterisisLowTresh: ${hlt} hysterisisHighTresh: ${hht} \n contrastConcatLengthFactor: ${cclf} \n dilationRadius: ${dr}`
        }
        
        new_display.innerText += '\n \n';
        new_display.innerText += `Trace time: ${trace_time}s \n`            
        new_display.innerText += `Paint distance: ${pd_fixed}m \n Paint + Fly Distance: ${td_fixed}m \n Flying time (0.5m/sec): ${time_fixed}`;        

        new_block.style.display = "block";
        block.parentNode.appendChild(new_block);
        // preview_zone.parentNode.appendChild(new_display);
        // display_zone.innerText = dronePaint.svgFile
    });

}
