var options = {"threshold":80,"type":"ratio","results_mode":"best_match","check_mode":"manual","force_match_source":null,"force_match_merge":null,"source_match_col":null,"merge_match_col":null}
var sourceCSV = null;
var mergeCSV = null;
var outputCSV = null;
var upto = 0;
var didFuzzy = false;

var ractive = new Ractive({
			el: '#app',
			template: '#template',
			data: {
				options: options,
				sourceCSV: sourceCSV,
				mergeCSV: mergeCSV,
				buttonText: "process",
				buttonStatus: false,
				upto:upto,
				sourceHeaders:[],
				mergeHeaders:[],
				totalRows:null,
				progressRows:0,
				userInput:false,
				sourceMatch:null,
				mergeMatch:null,
				matchCounter:0,
				matchTotal:0,
				matchRatio:0,
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
	var i = 0;
	loop();

	function loop() {
		if (i < sourceCSV.data.length) {

				console.log(i)
				var source_row = sourceCSV.data[i]
				var matches = []
				var fuzzy_matches = []
				var sourceString = source_row[options.source_match_col].trim().toLowerCase()
				var newRow = JSON.parse(JSON.stringify(source_row));
				var userInput = false;

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

					newRow['ratio_merge'] = "";
						
					addRowAndRestart()	
				}

				// More than one exact match, get the first one (maybe add manual mode later)

				else if (matches.length > 1) {
					mergeCSV.meta.fields.forEach(function(header) {
						newRow[header + "_merge"] = matches[0][header]
					})
					newRow['ratio_merge'] = "";
					addRowAndRestart()
				}

				// No exact match lets go FUZZY 

				else if (matches.length === 0) {

					didFuzzy = true;
					
					mergeCSV.data.forEach(function(merge_row) {

						var mergeString = merge_row[options.merge_match_col].trim().toLowerCase()

						var ratio = fuzzball[options.type](sourceString, mergeString);

						if (options.force_match_source != null && options.force_match_merge != null) {

							if (ratio >= options.threshold && source_row[options.force_match_source].trim().toLowerCase() === source_row[options.force_match_merge].trim().toLowerCase()) {
								merge_row.ratio_merge = ratio
								matches.push(merge_row)
							} 
						
						}

						else {
							if (ratio >= options.threshold) {
								merge_row.ratio_merge = ratio
								matches.push(merge_row)
							} 
						}

					});
					
					// Nothing matched, restart loop

					if (matches.length === 0) {
							mergeCSV.meta.fields.forEach(function(header) {
									newRow[header + "_merge"] = ""
								})
							newRow['ratio_merge'] = "";
							addRowAndRestart();
						}

					// Only one match	

					// if (matches.length === 1) {
					// 		mergeCSV.meta.fields.forEach(function(header) {
					// 		newRow[header + "_merge"] = matches[0][header]
					// 	})	

					// 	addRowAndRestart()	
					// }

					// One or more matches

					if (matches.length >= 1) {

						// Sort Get best matches first

						matches.sort(function(a, b) {
							    return a.ratio - b.ratio;
						});	

						// If we only want to see the best match, discard the rest

						if (options.results_mode === "best_match") {
							matches = matches.slice(0,1)
						}	
						
						// Automatic mode gets the best match regardless

						if (options.check_mode === "automatic") {
							mergeCSV.meta.fields.forEach(function(header) {
								newRow[header + "_merge"] = matches[0][header]
							})	

							newRow['ratio_merge'] = matches[0].ratio_merge;
							addRowAndRestart()
						}


						// Manual mode for checking matches

						else {

							ui = 0
							userLoop();

							function userLoop() {

								if (ui < matches.length) {

									ractive.set({
										'userInput':true,
										'sourceMatch':sourceString,
										'mergeMatch':matches[ui][options.merge_match_col],
										'matchCounter':ui +1,
										'matchTotal':matches.length,
										'matchRatio':matches[ui]['ratio_merge']
									}).then(function() {
										document.getElementById("discard").onclick = discard
										document.getElementById("keep").onclick = keep
										console.log("waiting for input");
									})

									var discard = function discard() {
										console.log("discard")
										ui = ui + 1
										userLoop();
									}

									var keep = function keep() {

										// Add selected data

										mergeCSV.meta.fields.forEach(function(header) {
											newRow[header + "_merge"] = matches[ui][header]
										})	
										newRow['ratio_merge'] = matches[ui]['ratio_merge']
										ractive.set({
											'userInput':false
										}).then(addRowAndRestart())
									}
								}

								else {

									mergeCSV.meta.fields.forEach(function(header) {
											newRow[header + "_merge"] = ""
									})
									newRow['ratio_merge'] = "";
									ractive.set({
										'userInput':false
									}).then(addRowAndRestart())
									console.log("restarting")
									
								}
							
							}

						}

					}

				}

			function addRowAndRestart() {
				outputCSV.push(newRow);
				ractive.set({'progressRows':i + 1, 'buttonStatus':false})
				i = i + 1;
				setTimeout(loop, 0);
			}	
			
		}

		else {
			upto = 4
			console.log("done")
			console.log(outputCSV);	
			var csv = Papa.unparse(outputCSV);
			var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
			ractive.set({
							'upto':upto,
							'buttonStatus':false,
				}).then( function() {
					var downloadButton = document.getElementById("downloadButton")
					downloadButton.href = window.URL.createObjectURL(csvData);
					downloadButton.setAttribute('download', 'download.csv');

				})
			
		}

	}	

}


function progress() {

	console.log("upto", upto)

	if (upto == 1) {

		console.log("1");

		var source = document.querySelector('.source input');
		var merge = document.querySelector('.merge input');
		console.log(source.files);
		console.log(merge.files);
		
		if (source.files.length == 1 && merge.files.length == 1) {
			console.log("parsing")
			
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

				console.log(sourceCSV)
				console.log(mergeCSV)

				if (sourceCSV.errors.length > 0 | mergeCSV.errors.length > 0) {
					ractive.set({
							'upto':upto,
							'buttonText':"merge options",
							'sourceCSV':sourceCSV,
							'mergeCSV':mergeCSV,
							'totalRows':sourceCSV.data.length,
							'uploadStatus':{"heading":"Imported, with errors", "message":"Your CSVs were imported with some errors, check below for the details, fix and then re-upload, or just go ahead anyway"}
						

						});					

					upto = 2
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
			'progressRows':1,
			'buttonStatus':false
		}).then( function () {
				mergeTheCSVs();
		})


	}
	
function blah() {
	console.log("blah")
}	
}