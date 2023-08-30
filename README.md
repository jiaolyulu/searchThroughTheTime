Readme 
folder: newBetty/google-search-innovation

## Update Search
### 1. get a code package from Active Theory
- perform a ```npm i```
- ```cd Utils``` then ```node fetchCmsAssetsLocal.js```

### 2. update the assets
- replace all the files in their ```HTML/assets/data/i18n``` to our repo ```Electron/HTML/assets/data/i18n```
- replace all the files in their ```HTML/assets/uploads``` to our repo ```Electron/HTML/assets/uploads```

### 3. update the data
- replace all the files in their ```HTML/assets/data/google/timeline/line_horizontal.json``` to our repo ```Electron/HTML/assets/data/google/timeline/line_horizontal.json```, this file is related to the 3D curve shape in the background, they would probably extend the curve by adding more data to the json to add more Milestone
- replace all the files in their ```HTML/assets/data/google/timeline/milestones_horizontal.json``` to our repo ```Electron/HTML/assets/data/google/timeline/milestones_horizontal.json``` this file is related to the Milestone positioning and its relative position relationship to the progress of the 3d curve, they would probably add more Milestone information here.
- replace all the files in their ```HTML/assets/data/uil.json``` to our repo ```Electron/HTML/assets/data/uil.json```, this uil is related to the shapes of color in their background that is somehow adding color to where the 3D curves form the shape of an icon. 

### 4. add new files
the way I did it is that I copied the whole HTML folder from Active Theory, create a new branch in Search repo called Active_Theory_Update, replace the whole repo. Then if I switch back to any of my branch, it would show all the new added files as untracked files. Then from this point you could decide which of them are necessary. Here is a list of files added that might be useful
-  ```/HTML/assets/geometry``` 
-  ```HTML/assets/images/shape``` and see if they added more

### 5. update Milestone related files
- ```HTML/assets/js/app/layouts/milestone/MilestoneAppearing.js``` is the file that decides when each milestone should be appearing. It needs update because it is comparing this value to the progress of the whole timeline to decide whether certain milestone should be appearing or not.
- ```HTML/assets/js/app/layouts/milestone/custom``` is probably where they would add new files for new milestones that have Deepdive
- ```HTML/assets/js/app/layouts/timeline/Timeline.js``` needs update because it has a list of milestone that needs deepdive view
- ```Electron/HTML/assets/runtime/boot.js``` boot is a file that has a list of all the js that need to be loaded. However, I did add some customized js inside. So we could not replace the whole file. It would be better to merge our file with Active Theory's file to get a whole list of javascript path that need to be included.




Deployments
---
FOR DEEPLOCAL:

To test- 
1) CD into Electron folder
2) npm run start
This will start an express server and provide the contents of the HTML folder at 127.0.0.1:8080
It will also create an electron app and display the 127.0.0.1:8080 in a fullscreen window across all displays.
2) npm run make
This will replace the execusion file on the production PC which is used by PM2. So the whole exhibition should be updated once the file is been made.

NOTES: You can preview the site at anytime by opening a chrome window and going to 127.0.0.1:8080

You can adjust the port number or content location in the Electron/electronMain.js file

