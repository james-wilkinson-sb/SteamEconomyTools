// ==UserScript==
// @name         Steam Economy Tools
// @namespace    http://jameswilko.com/
// @version      0.1
// @description  Tools for managing games Steam Economy easier
// @author       James Wilkinson
// @match        https://partner.steamgames.com/apps/inventoryservice/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	var itemDefFilesToUpload = [];
	var currentItemDefFile = -1;
	var currentUploadAttempts = 0;

	function startProcessingItemDefFiles()
	{
		console.log("Starting upload of item definitions");
		currentItemDefFile = -1;
		processNextItemDefFile();
	}

	function processNextItemDefFile()
	{
		currentItemDefFile++;
		if(currentItemDefFile < itemDefFilesToUpload.length)
		{
			var nextFile = itemDefFilesToUpload[ currentItemDefFile ];
			currentUploadAttempts = 1;
			processItemDefFile( nextFile );
		}
	}

	function processItemDefFile( file )
	{
		var progressElement = $J('#setUpload_' + currentItemDefFile);
		progressElement.html("Uploading... Attempt " + currentUploadAttempts);

		var elem = $J('#upload_item_defs');
		var fd = new FormData(elem[0]);
		fd.set( "itemdefs", file );

		var url = 'https://partner.steamgames.com/apps/inventoryserviceitemdefsupload/' + g_AppId + '/';
		jQuery.ajax( { url: url, type: 'POST', data: fd, processData: false, contentType: false } )
			.done( function( data )
			{
				progressElement.html(data.message);
				var retry = data.message.includes("Result code=16");
				if(retry)
				{
					currentUploadAttempts++;
					progressElement.html("Retrying upload... " + currentUploadAttempts);
					processItemDefFile( file );
				}
				else
				{
					progressElement.html(data.message + "<br/>" + "Succeeded after " + currentUploadAttempts + " attempts");
					processNextItemDefFile();
				}
			} )
			.fail( function( jqXHR, textStatus )
			{
				progressElement.html("Item definition upload failed");
				processNextItemDefFile();
			}
		);

	}

	// Multiple upload injection
	var uploadDiv = document.getElementById("ItemdefUpload");
	if(uploadDiv)
	{
		var htmlPatch = "";
		htmlPatch += "<br/>";
		htmlPatch += '<div id="dragDropItemDef" class="dropzone">';
		htmlPatch += '</div>';
		htmlPatch += `<a id="uploadMultipleItemDefFilesBtn" href="javascript:void(0)" class="btn_blue_white_innerfade btn_small_thin"><span>Upload Multiple</span></a>`;		
		htmlPatch += "<br/>";
		uploadDiv.innerHTML += htmlPatch;

		var dropzoneDiv = document.getElementById("dragDropItemDef");
		var myDropzone = new Dropzone("div#dragDropItemDef", { url: "/file/post",
			uploadMultiple : true,
			init: function () {
				this.on('addedfile', function( file ){
					itemDefFilesToUpload.push( file );
				});
			}
		});

		var uploadMultipleItemDefFilesBtn = document.getElementById("uploadMultipleItemDefFilesBtn");
		uploadMultipleItemDefFilesBtn.onclick = function()
		{
			var htmlPatch = "";
			htmlPatch += '<div id="itemDefUploadResults" class="landingTable itemdefs">';
			htmlPatch += '<div class="tr"><div class="th">File</div><div class="th">Progress</div></div>';
			for (var i = 0; i < itemDefFilesToUpload.length; i++)
			{
				var file = itemDefFilesToUpload[i];

				htmlPatch += '<div class="tr highlightHover">';
				htmlPatch += '<div class="td">' + file.name + '</div>';
				htmlPatch += '<div class="td"><span id="setUpload_' + i + '">' + "Waiting" + '</span></div>';
				htmlPatch += '</div>';
			}
			htmlPatch += '</div>';
			uploadDiv.innerHTML += htmlPatch;

			startProcessingItemDefFiles();
		};
	}

	console.log("Steam Economy Extensions loaded");

})();