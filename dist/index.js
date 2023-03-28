"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const esbuild = __importStar(require("esbuild"));
let STUB = 1;
/**
 * @typedef {Object} SiteProps
 * @property {string} server_directory location of files for the SSR server
 * @property {string} static_directory location of static page files
 * @property {string} prerendered_directory location of prerendered page files
 * @property {string[]} routes routes to static and prerendered pages
 */
STUB = 1;
/**
 * Prepare SvelteKit files for deployment to AWS services
 * @param {any} builder The SvelteKit provided [Builder]{@link https://kit.svelte.dev/docs/types#public-types-builder} object
 * @param {string} artifactPath The path where to place to SvelteKit files
 * @param {any} esbuildOptions Options to pass to esbuild
 * @returns {Promise<SiteProps>}
 */
function default_1(builder, artifactPath = 'build', esbuildOptions = {}) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        (0, fs_extra_1.emptyDirSync)(artifactPath);
        const static_directory = (0, path_1.join)(artifactPath, 'assets');
        if (!(0, fs_extra_1.existsSync)(static_directory)) {
            (0, fs_extra_1.mkdirSync)(static_directory, { recursive: true });
        }
        const prerendered_directory = (0, path_1.join)(artifactPath, 'prerendered');
        if (!(0, fs_extra_1.existsSync)(prerendered_directory)) {
            (0, fs_extra_1.mkdirSync)(prerendered_directory, { recursive: true });
        }
        const server_directory = (0, path_1.join)(artifactPath, 'server');
        if (!(0, fs_extra_1.existsSync)(server_directory)) {
            (0, fs_extra_1.mkdirSync)(server_directory, { recursive: true });
        }
        builder.log.minor('Copying asset files.');
        const clientFiles = yield builder.writeClient(static_directory);
        builder.log.minor('Copying server files.');
        yield builder.writeServer(artifactPath);
        (0, fs_extra_1.copyFileSync)(`${__dirname}/lambda/serverless.js`, `${server_directory}/_index.js`);
        (0, fs_extra_1.copyFileSync)(`${__dirname}/lambda/shims.js`, `${server_directory}/shims.js`);
        builder.log.minor('Building AWS Lambda server function.');
        esbuild.buildSync({
            entryPoints: [`${server_directory}/_index.js`],
            outfile: `${server_directory}/index.js`,
            inject: [(0, path_1.join)(`${server_directory}/shims.js`)],
            external: ['node:*', ...((_a = esbuildOptions === null || esbuildOptions === void 0 ? void 0 : esbuildOptions.external) !== null && _a !== void 0 ? _a : [])],
            format: (_b = esbuildOptions === null || esbuildOptions === void 0 ? void 0 : esbuildOptions.format) !== null && _b !== void 0 ? _b : 'cjs',
            banner: (_c = esbuildOptions === null || esbuildOptions === void 0 ? void 0 : esbuildOptions.banner) !== null && _c !== void 0 ? _c : {},
            bundle: true,
            platform: 'node',
            target: (_d = esbuildOptions === null || esbuildOptions === void 0 ? void 0 : esbuildOptions.target) !== null && _d !== void 0 ? _d : 'node16',
            treeShaking: true,
        });
        builder.log.minor('Prerendering static pages.');
        const prerenderedFiles = yield builder.writePrerendered(prerendered_directory);
        builder.log.minor('Cleanup project.');
        (0, fs_extra_1.unlinkSync)(`${server_directory}/_index.js`);
        (0, fs_extra_1.unlinkSync)(`${artifactPath}/index.js`);
        builder.log.minor('Exporting routes.');
        const routes = [
            ...new Set([...clientFiles, ...prerenderedFiles]
                .map((x) => {
                const z = (0, path_1.dirname)(x);
                if (z === '.')
                    return x;
                if (z.includes('/'))
                    return undefined;
                return `${z}/*`;
            })
                .filter(Boolean)),
        ];
        (0, fs_1.writeFileSync)((0, path_1.join)(artifactPath, 'routes.json'), JSON.stringify(routes));
        return {
            server_directory,
            static_directory,
            prerendered_directory,
            routes,
        };
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQWtDO0FBQ2xDLCtCQUFvQztBQUVwQyx1Q0FNaUI7QUFDakIsaURBQWtDO0FBRWxDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQTtBQUVaOzs7Ozs7R0FNRztBQUNILElBQUksR0FBRyxDQUFDLENBQUE7QUFTUjs7Ozs7O0dBTUc7QUFDSCxtQkFDRSxPQUFZLEVBQ1osZUFBdUIsT0FBTyxFQUM5QixpQkFBc0IsRUFBRTs7O1FBRXhCLElBQUEsdUJBQVksRUFBQyxZQUFZLENBQUMsQ0FBQTtRQUUxQixNQUFNLGdCQUFnQixHQUFHLElBQUEsV0FBSSxFQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNyRCxJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDakMsSUFBQSxvQkFBUyxFQUFDLGdCQUFnQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7U0FDakQ7UUFFRCxNQUFNLHFCQUFxQixHQUFHLElBQUEsV0FBSSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUMvRCxJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDdEMsSUFBQSxvQkFBUyxFQUFDLHFCQUFxQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7U0FDdEQ7UUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsV0FBSSxFQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNyRCxJQUFJLENBQUMsSUFBQSxxQkFBVSxFQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDakMsSUFBQSxvQkFBUyxFQUFDLGdCQUFnQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxD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QkFBZ0I7WUFDaEIscUJBQXFCO1lBQ3JCLE1BQU07U0FDUCxDQUFBOztDQUNGO0FBN0VELDRCQTZFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHdyaXRlRmlsZVN5bmMgfSBmcm9tICdmcydcbmltcG9ydCB7IGpvaW4sIGRpcm5hbWUgfSBmcm9tICdwYXRoJ1xuXG5pbXBvcnQge1xuICBjb3B5RmlsZVN5bmMsXG4gIHVubGlua1N5bmMsXG4gIGV4aXN0c1N5bmMsXG4gIG1rZGlyU3luYyxcbiAgZW1wdHlEaXJTeW5jLFxufSBmcm9tICdmcy1leHRyYSdcbmltcG9ydCAqIGFzIGVzYnVpbGQgZnJvbSAnZXNidWlsZCdcblxubGV0IFNUVUIgPSAxXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gU2l0ZVByb3BzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc2VydmVyX2RpcmVjdG9yeSBsb2NhdGlvbiBvZiBmaWxlcyBmb3IgdGhlIFNTUiBzZXJ2ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0aWNfZGlyZWN0b3J5IGxvY2F0aW9uIG9mIHN0YXRpYyBwYWdlIGZpbGVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcHJlcmVuZGVyZWRfZGlyZWN0b3J5IGxvY2F0aW9uIG9mIHByZXJlbmRlcmVkIHBhZ2UgZmlsZXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IHJvdXRlcyByb3V0ZXMgdG8gc3RhdGljIGFuZCBwcmVyZW5kZXJlZCBwYWdlc1xuICovXG5TVFVCID0gMVxuXG50eXBlIFNpdGVQcm9wcyA9IHtcbiAgc2VydmVyX2RpcmVjdG9yeTogc3RyaW5nXG4gIHN0YXRpY19kaXJlY3Rvcnk6IHN0cmluZ1xuICBwcmVyZW5kZXJlZF9kaXJlY3Rvcnk6IHN0cmluZ1xuICByb3V0ZXM6IHN0cmluZ1tdXG59XG5cbi8qKlxuICogUHJlcGFyZSBTdmVsdGVLaXQgZmlsZXMgZm9yIGRlcGxveW1lbnQgdG8gQVdTIHNlcnZpY2VzXG4gKiBAcGFyYW0ge2FueX0gYnVpbGRlciBUaGUgU3ZlbHRlS2l0IHByb3ZpZGVkIFtCdWlsZGVyXXtAbGluayBodHRwczovL2tpdC5zdmVsdGUuZGV2L2RvY3MvdHlwZXMjcHVibGljLXR5cGVzLWJ1aWxkZXJ9IG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IGFydGlmYWN0UGF0aCBUaGUgcGF0aCB3aGVyZSB0byBwbGFjZSB0byBTdmVsdGVLaXQgZmlsZXNcbiAqIEBwYXJhbSB7YW55fSBlc2J1aWxkT3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gZXNidWlsZFxuICogQHJldHVybnMge1Byb21pc2U8U2l0ZVByb3BzPn1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKFxuICBidWlsZGVyOiBhbnksXG4gIGFydGlmYWN0UGF0aDogc3RyaW5nID0gJ2J1aWxkJyxcbiAgZXNidWlsZE9wdGlvbnM6IGFueSA9IHt9XG4pOiBQcm9taXNlPFNpdGVQcm9wcz4ge1xuICBlbXB0eURpclN5bmMoYXJ0aWZhY3RQYXRoKVxuXG4gIGNvbnN0IHN0YXRpY19kaXJlY3RvcnkgPSBqb2luKGFydGlmYWN0UGF0aCwgJ2Fzc2V0cycpXG4gIGlmICghZXhpc3RzU3luYyhzdGF0aWNfZGlyZWN0b3J5KSkge1xuICAgIG1rZGlyU3luYyhzdGF0aWNfZGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICB9XG5cbiAgY29uc3QgcHJlcmVuZGVyZWRfZGlyZWN0b3J5ID0gam9pbihhcnRpZmFjdFBhdGgsICdwcmVyZW5kZXJlZCcpXG4gIGlmICghZXhpc3RzU3luYyhwcmVyZW5kZXJlZF9kaXJlY3RvcnkpKSB7XG4gICAgbWtkaXJTeW5jKHByZXJlbmRlcmVkX2RpcmVjdG9yeSwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgfVxuXG4gIGNvbnN0IHNlcnZlcl9kaXJlY3RvcnkgPSBqb2luKGFydGlmYWN0UGF0aCwgJ3NlcnZlcicpXG4gIGlmICghZXhpc3RzU3luYyhzZXJ2ZXJfZGlyZWN0b3J5KSkge1xuICAgIG1rZGlyU3luYyhzZXJ2ZXJfZGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICB9XG5cbiAgYnVpbGRlci5sb2cubWlub3IoJ0NvcHlpbmcgYXNzZXQgZmlsZXMuJylcbiAgY29uc3QgY2xpZW50RmlsZXMgPSBhd2FpdCBidWlsZGVyLndyaXRlQ2xpZW50KHN0YXRpY19kaXJlY3RvcnkpXG5cbiAgYnVpbGRlci5sb2cubWlub3IoJ0NvcHlpbmcgc2VydmVyIGZpbGVzLicpXG4gIGF3YWl0IGJ1aWxkZXIud3JpdGVTZXJ2ZXIoYXJ0aWZhY3RQYXRoKVxuICBjb3B5RmlsZVN5bmMoXG4gICAgYCR7X19kaXJuYW1lfS9sYW1iZGEvc2VydmVybGVzcy5qc2AsXG4gICAgYCR7c2VydmVyX2RpcmVjdG9yeX0vX2luZGV4LmpzYFxuICApXG4gIGNvcHlGaWxlU3luYyhgJHtfX2Rpcm5hbWV9L2xhbWJkYS9zaGltcy5qc2AsIGAke3NlcnZlcl9kaXJlY3Rvcnl9L3NoaW1zLmpzYClcblxuICBidWlsZGVyLmxvZy5taW5vcignQnVpbGRpbmcgQVdTIExhbWJkYSBzZXJ2ZXIgZnVuY3Rpb24uJylcbiAgZXNidWlsZC5idWlsZFN5bmMoe1xuICAgIGVudHJ5UG9pbnRzOiBbYCR7c2VydmVyX2RpcmVjdG9yeX0vX2luZGV4LmpzYF0sXG4gICAgb3V0ZmlsZTogYCR7c2VydmVyX2RpcmVjdG9yeX0vaW5kZXguanNgLFxuICAgIGluamVjdDogW2pvaW4oYCR7c2VydmVyX2RpcmVjdG9yeX0vc2hpbXMuanNgKV0sXG4gICAgZXh0ZXJuYWw6IFsnbm9kZToqJywgLi4uKGVzYnVpbGRPcHRpb25zPy5leHRlcm5hbCA/PyBbXSldLFxuICAgIGZvcm1hdDogZXNidWlsZE9wdGlvbnM/LmZvcm1hdCA/PyAnY2pzJyxcbiAgICBiYW5uZXI6IGVzYnVpbGRPcHRpb25zPy5iYW5uZXIgPz8ge30sXG4gICAgYnVuZGxlOiB0cnVlLFxuICAgIHBsYXRmb3JtOiAnbm9kZScsXG4gICAgdGFyZ2V0OiBlc2J1aWxkT3B0aW9ucz8udGFyZ2V0ID8/ICdub2RlMTYnLFxuICAgIHRyZWVTaGFraW5nOiB0cnVlLFxuICB9KVxuXG4gIGJ1aWxkZXIubG9nLm1pbm9yKCdQcmVyZW5kZXJpbmcgc3RhdGljIHBhZ2VzLicpXG4gIGNvbnN0IHByZXJlbmRlcmVkRmlsZXMgPSBhd2FpdCBidWlsZGVyLndyaXRlUHJlcmVuZGVyZWQocHJlcmVuZGVyZWRfZGlyZWN0b3J5KVxuXG4gIGJ1aWxkZXIubG9nLm1pbm9yKCdDbGVhbnVwIHByb2plY3QuJylcbiAgdW5saW5rU3luYyhgJHtzZXJ2ZXJfZGlyZWN0b3J5fS9faW5kZXguanNgKVxuICB1bmxpbmtTeW5jKGAke2FydGlmYWN0UGF0aH0vaW5kZXguanNgKVxuXG4gIGJ1aWxkZXIubG9nLm1pbm9yKCdFeHBvcnRpbmcgcm91dGVzLicpXG5cbiAgY29uc3Qgcm91dGVzOiBzdHJpbmdbXSA9IFtcbiAgICAuLi5uZXcgU2V0KFxuICAgICAgWy4uLmNsaWVudEZpbGVzLCAuLi5wcmVyZW5kZXJlZEZpbGVzXVxuICAgICAgICAubWFwKCh4KSA9PiB7XG4gICAgICAgICAgY29uc3QgeiA9IGRpcm5hbWUoeClcbiAgICAgICAgICBpZiAoeiA9PT0gJy4nKSByZXR1cm4geFxuICAgICAgICAgIGlmICh6LmluY2x1ZGVzKCcvJykpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICByZXR1cm4gYCR7en0vKmBcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICksXG4gIF1cblxuICB3cml0ZUZpbGVTeW5jKGpvaW4oYXJ0aWZhY3RQYXRoLCAncm91dGVzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkocm91dGVzKSlcblxuICByZXR1cm4ge1xuICAgIHNlcnZlcl9kaXJlY3RvcnksXG4gICAgc3RhdGljX2RpcmVjdG9yeSxcbiAgICBwcmVyZW5kZXJlZF9kaXJlY3RvcnksXG4gICAgcm91dGVzLFxuICB9XG59XG4iXX0=