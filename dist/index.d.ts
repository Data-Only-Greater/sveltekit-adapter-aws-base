type SiteProps = {
    server_directory: string;
    static_directory: string;
    prerendered_directory: string;
    routes: string[];
};
/**
 * Prepare SvelteKit files for deployment to AWS services
 * @param {any} builder The SvelteKit provided [Builder]{@link https://kit.svelte.dev/docs/types#public-types-builder} object
 * @param {string} artifactPath The path where to place to SvelteKit files
 * @param {any} esbuildOptions Options to pass to esbuild
 * @returns {Promise<SiteProps>}
 */
export default function (builder: any, artifactPath?: string, esbuildOptions?: any): Promise<SiteProps>;
export {};
