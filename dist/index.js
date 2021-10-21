require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 152:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {

"use strict";
__nccwpck_require__.r(__webpack_exports__);
/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   "DagsterCloudClient": () => (/* binding */ DagsterCloudClient)
/* harmony export */ });
const {GraphQLClient, gql} = __nccwpck_require__(608);



const LIST_LOCATION_QUERY = gql`
query WorkspaceEntries {
    workspace {
        workspaceEntries {
            locationName
            serializedDeploymentMetadata
        }
    }
}
`;

const ADD_LOCATION_MUTATION = gql`
mutation ($location: LocationSelector!) {
  addLocation(location: $location) {
     __typename
     ... on WorkspaceEntry {
       locationName
     }
     ... on PythonError {
       message
       stack
     }
  }
}
`;

const UPDATE_LOCATION_MUTATION = gql`
mutation ($location: LocationSelector!) {
  updateLocation(location: $location) {
     __typename
     ... on WorkspaceEntry {
       locationName
     }
     ... on PythonError {
       message
       stack
     }
  }
}
`;

class DagsterCloudClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;

    this.gqlClient = new GraphQLClient(url, {
      headers: {
        "Dagster-Cloud-Api-Token": token,
      },
    });
  }

  async updateLocation(location) {
    const locationList = await this.gqlClient.request(LIST_LOCATION_QUERY);
    const locationNames = locationList.workspace.workspaceEntries.map(entry => entry.locationName);

    let result;
    if (!locationNames.includes(location.name)) {
      result = (await this.gqlClient.request(ADD_LOCATION_MUTATION, {
        "location": location
      })).addLocation;
    } else {
      result = (await this.gqlClient.request(UPDATE_LOCATION_MUTATION, {
        "location": location
      })).updateLocation;
    }

    if (result.__typename === "PythonError") {
      throw new Error(result.message);
    }

    return result.locationName;
  }
}

/***/ }),

/***/ 637:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 813:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 140:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 608:
/***/ ((module) => {

module.exports = eval("require")("graphql-request");


/***/ }),

/***/ 872:
/***/ ((module) => {

module.exports = eval("require")("yaml");


/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 87:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 669:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(637);
const exec = __nccwpck_require__(813);
const github = __nccwpck_require__(140);
const fs = __nccwpck_require__(747);
const os = __nccwpck_require__(87);
const path = __nccwpck_require__(622);
const util = __nccwpck_require__(669);
const YAML = __nccwpck_require__(872);
const {DagsterCloudClient} = __nccwpck_require__(152);

const writeFileAsync = util.promisify(fs.writeFile);

async function inParallel(locations, processingFunction) {
  await Promise.all(Object.entries(locations).map(processingFunction));
}

async function inSeries(locations, processingFunction) {
  for (const location of locations) {
    await processingFunction(location);
  }
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dagster-cloud-ci'));
}

async function writeRequirementsDockerfile(baseImage) {
  const dockerfilePath = path.join(tmpDir(), 'Dockerfile');
  await writeFileAsync(dockerfilePath, `
FROM ${baseImage}

COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /opt/dagster/app

COPY . /opt/dagster/app
  `);
  return dockerfilePath;
}

async function run() {
  try {
    const imageTag = core.getInput('image-tag') || github.context.sha.substring(0, 6);

    const locationFile = core.getInput('location-file');

    const locations = await core.group('Read locations.yaml', async () => {
      const locationsFile = fs.readFileSync(locationFile, 'utf8');
      return YAML.parse(locationsFile).locations;
    }).catch(error => {
      core.error(`Error reading locations.yaml: ${error}`, file = locations);
    });

    const parallel = core.getBooleanInput('parallel');
    const process = parallel ? inParallel : inSeries;

    await core.group('Build Docker images', async () => {
      await process(locations, async ([_, location]) => {
        const basePath = path.parse(locationFile).dir;
        const buildPath = path.join(basePath, location['build']);

        let dockerfile = path.join(buildPath, 'Dockerfile');
        const baseImage = location['base_image'];

        if (!fs.existsSync(dockerfile)) {
          const requirementsFile = path.join(buildPath, 'requirements.txt');

          if (!fs.existsSync(requirementsFile) || !baseImage) {
            core.error("Supplied build path must either contain Dockerfile, or requirements.txt with base_image");
          }

          dockerfile = await writeRequirementsDockerfile(baseImage);
        } else {
          if (baseImage) {
            core.error("No need to specify base_image for location if build path contains Dockerfile");
          }

          dockerfile = './Dockerfile';
        }

        const imageName = `${location['registry']}:${imageTag}`;

        await exec.exec('docker',
          [
            'build', '.',
            '--label', `sha=${github.context.sha}`,
            '-f', dockerfile,
            '-t', imageName
          ],
          options = {'cwd': buildPath}
        );
      });
    });

    await core.group('Push Docker image', async () => {
      await process(locations, async ([_, location]) => {
        const imageName = `${location['registry']}:${imageTag}`;
        await exec.exec('docker', ['push', imageName]);
      });
    });

    await core.group('Update workspace locations', async () => {
      const dagitUrl = core.getInput('dagit-url');
      const endpoint = `${dagitUrl}/graphql`

      const apiToken = core.getInput('api-token');

      const client = new DagsterCloudClient(endpoint, apiToken);

      await process(locations, async ([locationName, location]) => {
        const pythonFile = location['python_file'];
        const packageName = location['package_name'];
        if (!(pythonFile || packageName) || (pythonFile && packageName)) {
          core.error(`Must provide exactly one of python_file or package_name on location ${locationName}.`)
        }

        // Optionally include some experimental git data in the location metadata
        // used for some rich linking UI
        const includeGitData = core.getBooleanInput('experimental-git-data');
        const sha = github.context.sha;
        const shortSha = sha.substr(0, 6);
        const url = `https://github.com/${github.context.repo.owner}/`
          + `${github.context.repo.repo}/tree/${shortSha}/${location['build']}`;

        const locationData = {
          name: locationName,
          image: `${location['registry']}:${imageTag}`,
          pythonFile: pythonFile,
          packageName: packageName,
          sha: includeGitData ? sha : undefined,
          url: includeGitData ? url : undefined
        }

        const result = await client.updateLocation(locationData);
        core.info(`Successfully updated location ${result}`);
      });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map