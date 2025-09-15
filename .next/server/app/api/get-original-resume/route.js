"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/get-original-resume/route";
exports.ids = ["app/api/get-original-resume/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-original-resume%2Froute&page=%2Fapi%2Fget-original-resume%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-original-resume%2Froute.ts&appDir=%2FVolumes%2FCrucible%2Fresume-frontend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FVolumes%2FCrucible%2Fresume-frontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-original-resume%2Froute&page=%2Fapi%2Fget-original-resume%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-original-resume%2Froute.ts&appDir=%2FVolumes%2FCrucible%2Fresume-frontend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FVolumes%2FCrucible%2Fresume-frontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Volumes_Crucible_resume_frontend_src_app_api_get_original_resume_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/get-original-resume/route.ts */ \"(rsc)/./src/app/api/get-original-resume/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/get-original-resume/route\",\n        pathname: \"/api/get-original-resume\",\n        filename: \"route\",\n        bundlePath: \"app/api/get-original-resume/route\"\n    },\n    resolvedPagePath: \"/Volumes/Crucible/resume-frontend/src/app/api/get-original-resume/route.ts\",\n    nextConfigOutput,\n    userland: _Volumes_Crucible_resume_frontend_src_app_api_get_original_resume_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/get-original-resume/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZnZXQtb3JpZ2luYWwtcmVzdW1lJTJGcm91dGUmcGFnZT0lMkZhcGklMkZnZXQtb3JpZ2luYWwtcmVzdW1lJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGZ2V0LW9yaWdpbmFsLXJlc3VtZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZWb2x1bWVzJTJGQ3J1Y2libGUlMkZyZXN1bWUtZnJvbnRlbmQlMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlZvbHVtZXMlMkZDcnVjaWJsZSUyRnJlc3VtZS1mcm9udGVuZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDMEI7QUFDdkc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZXN1bWUtZnJvbnRlbmQvPzU3MjUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1ZvbHVtZXMvQ3J1Y2libGUvcmVzdW1lLWZyb250ZW5kL3NyYy9hcHAvYXBpL2dldC1vcmlnaW5hbC1yZXN1bWUvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dldC1vcmlnaW5hbC1yZXN1bWUvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9nZXQtb3JpZ2luYWwtcmVzdW1lXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9nZXQtb3JpZ2luYWwtcmVzdW1lL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1ZvbHVtZXMvQ3J1Y2libGUvcmVzdW1lLWZyb250ZW5kL3NyYy9hcHAvYXBpL2dldC1vcmlnaW5hbC1yZXN1bWUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2dldC1vcmlnaW5hbC1yZXN1bWUvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-original-resume%2Froute&page=%2Fapi%2Fget-original-resume%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-original-resume%2Froute.ts&appDir=%2FVolumes%2FCrucible%2Fresume-frontend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FVolumes%2FCrucible%2Fresume-frontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/get-original-resume/route.ts":
/*!**************************************************!*\
  !*** ./src/app/api/get-original-resume/route.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! child_process */ \"child_process\");\n/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! util */ \"util\");\n/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\n\nconst execAsync = (0,util__WEBPACK_IMPORTED_MODULE_2__.promisify)(child_process__WEBPACK_IMPORTED_MODULE_1__.exec);\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_3__.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);\nasync function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const userId = searchParams.get(\"userId\");\n        if (!userId) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"User ID is required\"\n            }, {\n                status: 400\n            });\n        }\n        // First, try to get the latest original resume from Supabase storage\n        const { data: files, error } = await supabase.storage.from(\"user-documents\").list(`${userId}/`, {\n            sortBy: {\n                column: \"created_at\",\n                order: \"desc\"\n            }\n        });\n        if (error) {\n            console.error(\"Error listing files:\", error);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Failed to fetch resumes\"\n            }, {\n                status: 500\n            });\n        }\n        // Find the latest resume file\n        const resumeFiles = files?.filter((file)=>file.name.startsWith(\"resume_\") && file.name.endsWith(\".pdf\")) || [];\n        if (resumeFiles.length === 0) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No resume found\"\n            }, {\n                status: 404\n            });\n        }\n        const latestResume = resumeFiles[0];\n        const filePath = `${userId}/${latestResume.name}`;\n        // Get the file from Supabase storage\n        const { data: fileData, error: downloadError } = await supabase.storage.from(\"user-documents\").download(filePath);\n        if (downloadError) {\n            console.error(\"Error downloading file:\", downloadError);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Failed to download resume\"\n            }, {\n                status: 500\n            });\n        }\n        // Convert PDF to image for comparison\n        // For now, we'll return the PDF and let the frontend handle conversion\n        // In a real implementation, you might want to convert to image on the server\n        return new next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse(fileData, {\n            status: 200,\n            headers: {\n                \"Content-Type\": \"application/pdf\",\n                \"Cache-Control\": \"no-cache, no-store, must-revalidate\"\n            }\n        });\n    } catch (error) {\n        console.error(\"API Error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Internal server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9nZXQtb3JpZ2luYWwtcmVzdW1lL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBd0Q7QUFDSDtBQUNoQjtBQUNKO0FBRWpDLE1BQU1JLFlBQVlELCtDQUFTQSxDQUFDRCwrQ0FBSUE7QUFFaEMsTUFBTUcsV0FBV0osbUVBQVlBLENBQzNCSyxRQUFRQyxHQUFHLENBQUNDLHdCQUF3QixFQUNwQ0YsUUFBUUMsR0FBRyxDQUFDRSx5QkFBeUI7QUFHaEMsZUFBZUMsSUFBSUMsT0FBb0I7SUFDNUMsSUFBSTtRQUNGLE1BQU0sRUFBRUMsWUFBWSxFQUFFLEdBQUcsSUFBSUMsSUFBSUYsUUFBUUcsR0FBRztRQUM1QyxNQUFNQyxTQUFTSCxhQUFhSSxHQUFHLENBQUM7UUFFaEMsSUFBSSxDQUFDRCxRQUFRO1lBQ1gsT0FBT2YscURBQVlBLENBQUNpQixJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBc0IsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQzNFO1FBRUEscUVBQXFFO1FBQ3JFLE1BQU0sRUFBRUMsTUFBTUMsS0FBSyxFQUFFSCxLQUFLLEVBQUUsR0FBRyxNQUFNYixTQUFTaUIsT0FBTyxDQUNsREMsSUFBSSxDQUFDLGtCQUNMQyxJQUFJLENBQUMsQ0FBQyxFQUFFVCxPQUFPLENBQUMsQ0FBQyxFQUFFO1lBQ2xCVSxRQUFRO2dCQUFFQyxRQUFRO2dCQUFjQyxPQUFPO1lBQU87UUFDaEQ7UUFFRixJQUFJVCxPQUFPO1lBQ1RVLFFBQVFWLEtBQUssQ0FBQyx3QkFBd0JBO1lBQ3RDLE9BQU9sQixxREFBWUEsQ0FBQ2lCLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUEwQixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDL0U7UUFFQSw4QkFBOEI7UUFDOUIsTUFBTVUsY0FBY1IsT0FBT1MsT0FBT0MsQ0FBQUEsT0FBUUEsS0FBS0MsSUFBSSxDQUFDQyxVQUFVLENBQUMsY0FBY0YsS0FBS0MsSUFBSSxDQUFDRSxRQUFRLENBQUMsWUFBWSxFQUFFO1FBRTlHLElBQUlMLFlBQVlNLE1BQU0sS0FBSyxHQUFHO1lBQzVCLE9BQU9uQyxxREFBWUEsQ0FBQ2lCLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFrQixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDdkU7UUFFQSxNQUFNaUIsZUFBZVAsV0FBVyxDQUFDLEVBQUU7UUFDbkMsTUFBTVEsV0FBVyxDQUFDLEVBQUV0QixPQUFPLENBQUMsRUFBRXFCLGFBQWFKLElBQUksQ0FBQyxDQUFDO1FBRWpELHFDQUFxQztRQUNyQyxNQUFNLEVBQUVaLE1BQU1rQixRQUFRLEVBQUVwQixPQUFPcUIsYUFBYSxFQUFFLEdBQUcsTUFBTWxDLFNBQVNpQixPQUFPLENBQ3BFQyxJQUFJLENBQUMsa0JBQ0xpQixRQUFRLENBQUNIO1FBRVosSUFBSUUsZUFBZTtZQUNqQlgsUUFBUVYsS0FBSyxDQUFDLDJCQUEyQnFCO1lBQ3pDLE9BQU92QyxxREFBWUEsQ0FBQ2lCLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUE0QixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDakY7UUFFQSxzQ0FBc0M7UUFDdEMsdUVBQXVFO1FBQ3ZFLDZFQUE2RTtRQUU3RSxPQUFPLElBQUluQixxREFBWUEsQ0FBQ3NDLFVBQVU7WUFDaENuQixRQUFRO1lBQ1JzQixTQUFTO2dCQUNQLGdCQUFnQjtnQkFDaEIsaUJBQWlCO1lBQ25CO1FBQ0Y7SUFFRixFQUFFLE9BQU92QixPQUFPO1FBQ2RVLFFBQVFWLEtBQUssQ0FBQyxjQUFjQTtRQUM1QixPQUFPbEIscURBQVlBLENBQUNpQixJQUFJLENBQUM7WUFBRUMsT0FBTztRQUF3QixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM3RTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmVzdW1lLWZyb250ZW5kLy4vc3JjL2FwcC9hcGkvZ2V0LW9yaWdpbmFsLXJlc3VtZS9yb3V0ZS50cz82NWMxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xuaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSAndXRpbCc7XG5cbmNvbnN0IGV4ZWNBc3luYyA9IHByb21pc2lmeShleGVjKTtcblxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXG4gIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCEsXG4gIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkhXG4pO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICAgIGNvbnN0IHVzZXJJZCA9IHNlYXJjaFBhcmFtcy5nZXQoJ3VzZXJJZCcpO1xuXG4gICAgaWYgKCF1c2VySWQpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVXNlciBJRCBpcyByZXF1aXJlZCcgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgICB9XG5cbiAgICAvLyBGaXJzdCwgdHJ5IHRvIGdldCB0aGUgbGF0ZXN0IG9yaWdpbmFsIHJlc3VtZSBmcm9tIFN1cGFiYXNlIHN0b3JhZ2VcbiAgICBjb25zdCB7IGRhdGE6IGZpbGVzLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2Uuc3RvcmFnZVxuICAgICAgLmZyb20oJ3VzZXItZG9jdW1lbnRzJylcbiAgICAgIC5saXN0KGAke3VzZXJJZH0vYCwge1xuICAgICAgICBzb3J0Qnk6IHsgY29sdW1uOiAnY3JlYXRlZF9hdCcsIG9yZGVyOiAnZGVzYycgfVxuICAgICAgfSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxpc3RpbmcgZmlsZXM6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gZmV0Y2ggcmVzdW1lcycgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBsYXRlc3QgcmVzdW1lIGZpbGVcbiAgICBjb25zdCByZXN1bWVGaWxlcyA9IGZpbGVzPy5maWx0ZXIoZmlsZSA9PiBmaWxlLm5hbWUuc3RhcnRzV2l0aCgncmVzdW1lXycpICYmIGZpbGUubmFtZS5lbmRzV2l0aCgnLnBkZicpKSB8fCBbXTtcblxuICAgIGlmIChyZXN1bWVGaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnTm8gcmVzdW1lIGZvdW5kJyB9LCB7IHN0YXR1czogNDA0IH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGxhdGVzdFJlc3VtZSA9IHJlc3VtZUZpbGVzWzBdO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7dXNlcklkfS8ke2xhdGVzdFJlc3VtZS5uYW1lfWA7XG5cbiAgICAvLyBHZXQgdGhlIGZpbGUgZnJvbSBTdXBhYmFzZSBzdG9yYWdlXG4gICAgY29uc3QgeyBkYXRhOiBmaWxlRGF0YSwgZXJyb3I6IGRvd25sb2FkRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLnN0b3JhZ2VcbiAgICAgIC5mcm9tKCd1c2VyLWRvY3VtZW50cycpXG4gICAgICAuZG93bmxvYWQoZmlsZVBhdGgpO1xuXG4gICAgaWYgKGRvd25sb2FkRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRvd25sb2FkaW5nIGZpbGU6JywgZG93bmxvYWRFcnJvcik7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBkb3dubG9hZCByZXN1bWUnIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCBQREYgdG8gaW1hZ2UgZm9yIGNvbXBhcmlzb25cbiAgICAvLyBGb3Igbm93LCB3ZSdsbCByZXR1cm4gdGhlIFBERiBhbmQgbGV0IHRoZSBmcm9udGVuZCBoYW5kbGUgY29udmVyc2lvblxuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgeW91IG1pZ2h0IHdhbnQgdG8gY29udmVydCB0byBpbWFnZSBvbiB0aGUgc2VydmVyXG5cbiAgICByZXR1cm4gbmV3IE5leHRSZXNwb25zZShmaWxlRGF0YSwge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vcGRmJyxcbiAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGUnXG4gICAgICB9XG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdBUEkgRXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59Il0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNyZWF0ZUNsaWVudCIsImV4ZWMiLCJwcm9taXNpZnkiLCJleGVjQXN5bmMiLCJzdXBhYmFzZSIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiR0VUIiwicmVxdWVzdCIsInNlYXJjaFBhcmFtcyIsIlVSTCIsInVybCIsInVzZXJJZCIsImdldCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImRhdGEiLCJmaWxlcyIsInN0b3JhZ2UiLCJmcm9tIiwibGlzdCIsInNvcnRCeSIsImNvbHVtbiIsIm9yZGVyIiwiY29uc29sZSIsInJlc3VtZUZpbGVzIiwiZmlsdGVyIiwiZmlsZSIsIm5hbWUiLCJzdGFydHNXaXRoIiwiZW5kc1dpdGgiLCJsZW5ndGgiLCJsYXRlc3RSZXN1bWUiLCJmaWxlUGF0aCIsImZpbGVEYXRhIiwiZG93bmxvYWRFcnJvciIsImRvd25sb2FkIiwiaGVhZGVycyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/get-original-resume/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fget-original-resume%2Froute&page=%2Fapi%2Fget-original-resume%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fget-original-resume%2Froute.ts&appDir=%2FVolumes%2FCrucible%2Fresume-frontend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FVolumes%2FCrucible%2Fresume-frontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();