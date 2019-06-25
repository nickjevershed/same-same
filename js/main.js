var options = {"threshhold":80,"type":"ratio","results_mode":"highest_only","check_mode":"manual","force_match":[],"match_cols":[]}
var sourceCSV = null;
var mergeCSV = null;
var outputCSV = null;
var upto = 0;

var ractive = new Ractive({
			el: '#app',
			template: '#template',
			data: {
				options: options,
				sourceCSV: sourceCSV,
				mergeCSV: mergeCSV,
				buttonText: "process",
				buttonStatus: "inactive",
				upto:upto,
				sourceHeaders:[],
				mergeHeaders:[]
			}
});

function dragOverHandler(ev) {
	console.log('File(s) in drop zone'); 
	ev.preventDefault();
	}

function dropHandler(ev) {
	console.log('File(s) dropped');
	console.log(ev.target.id);
	ev.preventDefault();
	var fileInput = document.querySelector('#' + ev.target.id + ' input');
	fileInput.files = ev.dataTransfer.files;
}

function progress() {

	if (upto == 0) {
		var source = document.querySelector('#source input');
		var merge = document.querySelector('#merge input');
		console.log(source.files);
		
		if (source.files.length == 1 && merge.files.length == 1) {
			
			Papa.parse(source.files[0], {
					header: true,
					complete: function(results) {
						sourceCSV = results;
						if (mergeCSV != null) {
							ractive.set({
								'upto':1,
								'sourceHeaders':sourceCSV.meta.fields,
								'mergeHeaders':mergeCSV.meta.fields
							});
						}
					}
			});

			Papa.parse(merge.files[0], {
					header: true,
					complete: function(results) {
						mergeCSV = results;
						if (sourceCSV != null) {
							ractive.set({
								'upto':1,
								'sourceHeaders':sourceCSV.meta.fields,
								'mergeHeaders':mergeCSV.meta.fields
							});
						}
					}
			});
		
		}

		// upto = 1
		
	}

	// if (upto < 3) {
	// 	upto++
	// }
	
}