var options = {"threshold":80,"type":"ratio","results_mode":"best_match","check_mode":"manual","force_match_source":null,"force_match_merge":null,"source_match_col":null,"merge_match_col":null}
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
				buttonStatus: false,
				buttonStatus: "inactive",
				upto:upto,
				sourceHeaders:[],
				mergeHeaders:[],
				totalRows:null,
				progressRows:0,
				uploadStatus:{"heading":"Success!","message":"Successfully imported CSVs. Check to make sure everything looks right, then you're all good to merge"}
			}
});


ractive.observe( 'options', function ( newValue ) {
	console.log(options)
});

function dragOverHandler(ev) {
	console.log('File(s) in drop zone'); 
	ev.preventDefault();
	}

function clickButton(target) {
	document.querySelector('.' + target + ' input').click();
}

function dropHandler(ev) {
	console.log('File(s) dropped');
	console.log(ev.target.id);
	ev.preventDefault();
	var fileInput = document.querySelector('.' + ev.target.id + ' input');
	fileInput.files = ev.dataTransfer.files;
	checkUploads();
}

function checkUploads() {
	var source = document.querySelector('.source input');
	var merge = document.querySelector('.merge input');
	if (source.files.length == 1 && merge.files.length == 1) {
			ractive.set('buttonStatus',true);
			upto = 1
		}
}

function mergeTheCSVs() {

	outputCSV = []

	sourceCSV.data.forEach(function(source_row,i) {

		console.log(i)
		var matches = []
		var fuzzy_matches = []
		var sourceString = source_row[options.source_match_col].trim().toLowerCase()
		var newRow = JSON.parse(JSON.stringify(source_row));

		// Check for exact matches

		mergeCSV.data.forEach(function(merge_row) {

			var mergeString = merge_row[options.merge_match_col].trim().toLowerCase()

			if (options.force_match_source != null && options.force_match_merge != null) {
				if (sourceString === mergeString && source_row[options.force_match_source].trim().toLowerCase() === source_row[options.force_match_merge].trim().toLowerCase()) {
					matches.push(merge_row)
				} 
			}

			else {
				if (sourceString === mergeString) {
					matches.push(merge_row)
				} 
			}

		});

		// One exact match

		if (matches.length === 1) {
				mergeCSV.meta.fields.forEach(function(header) {
				newRow[header + "_merge"] = matches[0][header]
			})	
		}

		// More than one exact match, later on add the option to manually select which one you want

		else if (matches.length > 1) {
			mergeCSV.meta.fields.forEach(function(header) {
				newRow[header + "_merge"] = matches[0][header]
			})
		}

		// No exact match lets go FUZZY 

		else if (matches.length === 0) {
			
			mergeCSV.data.forEach(function(merge_row) {

				var mergeString = merge_row[options.merge_match_col].trim().toLowerCase()

				var ratio = fuzzball[options.type](sourceString, mergeString);

				if (options.force_match_source != null && options.force_match_merge != null) {

					if (ratio >= options.threshold && source_row[options.force_match_source].trim().toLowerCase() === source_row[options.force_match_merge].trim().toLowerCase()) {
						merge_row.ratio = ratio
						matches.push(merge_row)
					} 
				
				}

				else {
					if (ratio >= options.threshold) {
						merge_row.ratio = ratio
						matches.push(merge_row)
					} 
				}

			});
			
			if (matches.length === 1) {
					mergeCSV.meta.fields.forEach(function(header) {
					newRow[header + "_merge"] = matches[0][header]
				})	
			}

			if (matches.length > 1) {

				if (options.results_mode === "best_match") {
					matches.sort(function(a, b) {
					    return a.ratio - b.ratio;
					});	
				
					mergeCSV.meta.fields.forEach(function(header) {
						newRow[header + "_merge"] = matches[0][header]
					})	
				}
					
			}

		}	

	outputCSV.push(newRow);
	ractive.set('progressRows',i + 1)
	console.log("the end")

	});

	console.log(outputCSV);
}


function progress() {

	console.log("upto", upto)

	if (upto == 1) {

		console.log("1");

		var source = document.querySelector('.source input');
		var merge = document.querySelector('.merge input');
		console.log(source.files);
		
		if (source.files.length == 1 && merge.files.length == 1) {
			
			Papa.parse(source.files[0], {
					header: true,
					complete: function(results) {
						sourceCSV = results;
						if (mergeCSV != null) {
							update1()
						}
					}
			});

			Papa.parse(merge.files[0], {
					header: true,
					complete: function(results) {
						mergeCSV = results;
						if (sourceCSV != null) {
							update1()
						}
					}
			});
		

			function update1() {

				// console.log(sourceCSV)

				if (sourceCSV.errors.length > 0 | mergeCSV.errors.length > 0) {
					buttonStatus = false;
					ractive.set({
							'buttonStatus':buttonStatus,
							'sourceCSV':sourceCSV,
							'mergeCSV':mergeCSV,
							'uploadStatus':{"heading":"Imported, with errors", "message":"Your CSVs were imported with some errors, check below for the details, fix and then re-upload"}
						});
					

				}

				else {

					ractive.set({
						'upto':upto,
						'buttonText':"merge options",
						'sourceCSV':sourceCSV,
						'mergeCSV':mergeCSV,
						'totalRows':sourceCSV.data.length
					});

					console.log("sert")
					upto = 2
				}

			}


		}
		
	}

	else if (upto == 2) {

		console.log("2")
		options.source_match_col = sourceCSV.meta.fields[0]
		options.merge_match_col = mergeCSV.meta.fields[0]

		ractive.set({
					'upto':upto,
					'buttonText':"merge CSVs",
					'sourceHeaders':sourceCSV.meta.fields,
					'mergeHeaders':mergeCSV.meta.fields,
					'options':options
				}).then( function() {
					upto = 3
				})

		
	}

	else if (upto == 3) {
		console.log("3")
		
		ractive.set({
			'upto':upto,
			'progressRows':1
		}).then( function () {
			console.log("done")
			setTimeout(function() {
				mergeTheCSVs();
			},1000)
			
		})


	}
	
function blah() {
	console.log("blah")
}	
}