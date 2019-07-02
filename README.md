![alt text][logo]

[logo]: https://github.com/MagnumOpuses/project-meta/blob/master/img/jobtechdev_black.png "JobTech dev logo"
[A JobTech Project]( https://www.jobtechdev.se)
# MapWidget

this React component shows number of results in counties or municipalities. And can be used to interact both to and from. 
The app can show what ever you want, we have built it for jobs. Read more about the this component [here](#MapWidget)

## Version

This project is a beta version. 

## Getting Started

This project was built with [Create React App](https://github.com/facebook/create-react-app), [OpenLayers](https://openlayers.org) and [Lantmäteriets Topografic map](https://www.lantmateriet.se/sv/Kartor-och-geografisk-information/Geodatatjanster/Visningstjanster/?faq=7e09).
Everything is open source but you need to register at [Lantmäteriet](https://opendata.lantmateriet.se/#register) to get a key to be able to use the map.

### Prerequisites

You need to copy the [.env.default](./.env.default) to .env and add the api key from Lantmäteriet.<br>
And you will need [npm](https://www.npmjs.com/) on your computer. 

### Installation

Easiest way to get started:

1. Click **Clone or download**
2. Select **Download ZIP** (or clone it)
3. Unzip the project
4. Open a terminal of your liking, Terminal (Mac) or cmd/PowerShell (Windows)
5. Navigate to the unzipped project
6. Run the following command **`npm i`** or **`npm install`**
7. Start the project by running **`npm start`**
8. DONE! The project will be running at [http://localhost:3000](http://localhost:3000)


## Create React App commands

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build` / Deployment

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes and put in the build folder.<br>

Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).




## MapWidget 

File structure
```
my-app
├── README.md - this file
├── node_modules - needed libraries
├── package.json - config file
├── .gitignore - git ignore file
├── .env.default - settings for the app/component
├── public - from where the app runs
│   ├── favicon.ico - browser favoicon
│   ├── index.html  - running file
│   ├── kommuner-kustlinjer.geo.json  - geo json polygons of municipalities
│   ├── laen-kustlinjer.geo.json  - geo json polygons of counties
│   └── manifest.json - react file
└── src
    components 
      ├── api
          └── api.js - file to fetch data from API
      └── map
          ├── custom.css - css for element in the map
          ├── helpers.js - helping functions in the component
          ├── layers.js - the layers in the map
          ├── map.js - the main component file
          └── styling - styling for the layers
    ├── index.css - minor css
    ├── index.js - running js file
    └── serviceWorker.js - react file
```

The MapWidget has three modes:

* County - shows counties. can be switched to Municipality after start by user
* Municipality - shows municipalities. can be switched to County after start by user
* Heatmap - shows a heatmap on available data

Data can be put into/get out of the component by:

* react props from parent
  * height - string - css height styling
  * width - string - css width styling
  * mode - string - start mode
  * location - string - an County or Municipality to select
  * q - string to pass to API (`not complete yet`)
  * mapData - obj  <br>
    * total - number - totalt results<br>
    * array - objects of results<br>
      * name - string with shown name
      * value - value in area
                  

* data attributes from a element with the id "jobTechVaribles"
  * location - string - an County or Municipality to select
  * q - string to pass to API
* API - the heatmap uses the `REACT_APP_DEV_API_BASEURL`and `REACT_APP_DEV_API_URL` from the .env file.


The element with id will be updated with data from component as well. 
Also on row 521 location can be passed to parent function if you use the map component in another component.

## Contributing

Please if you find bugs or better solutions, please contact us or write a bug report. 

## License

This is an open source project, use it freely.


## Acknowledgments