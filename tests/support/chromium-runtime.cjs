const fs = require("node:fs");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { createBrotliDecompress } = require("node:zlib");
const tar = require("tar-fs");
const chromiumBundle = require("@sparticuz/chromium").default;

const minimumChromiumBytes = 100000000;
chromiumBundle.setGraphicsMode = false;

async function resolveChromiumRuntime(){
    if(process.env.CMS_CHROMIUM_PATH){
        return {
            executablePath: process.env.CMS_CHROMIUM_PATH,
            args: chromiumBundle.args
        };
    }

    const cacheDirectory = process.env.CMS_CHROMIUM_CACHE_DIR || "/tmp/cms-chromium-runtime";
    const executablePath = path.join(cacheDirectory, "chromium");
    const glesPath = path.join(cacheDirectory, "libGLESv2.so");
    const fontCacheDirectory = path.join(cacheDirectory, "font-cache");
    fs.mkdirSync(fontCacheDirectory, { recursive: true });
    process.env.XDG_CACHE_HOME ??= fontCacheDirectory;
    const packageEntry = require.resolve("@sparticuz/chromium");
    const packageBin = path.resolve(path.dirname(packageEntry), "../bin");

    if(!fs.existsSync(glesPath)){
        await extractBrotliTar(path.join(packageBin, "swiftshader.tar.br"), cacheDirectory);
    }
    try{
        if(fs.statSync(executablePath).size >= minimumChromiumBytes){
            return { executablePath, args: chromiumBundle.args };
        }
    }catch(error){
        if(error.code !== "ENOENT"){ throw error; }
    }

    const compressedPath = path.join(packageBin, "chromium.br");
    const partialPath = `${executablePath}.partial-${process.pid}`;
    fs.mkdirSync(cacheDirectory, { recursive: true });

    try{
        await pipeline(
            fs.createReadStream(compressedPath),
            createBrotliDecompress({ chunkSize: 2 ** 21 }),
            fs.createWriteStream(partialPath, { mode: 0o700 })
        );
        fs.renameSync(partialPath, executablePath);
        fs.chmodSync(executablePath, 0o700);
    }catch(error){
        try{ fs.unlinkSync(partialPath); }
        catch(cleanupError){
            if(cleanupError.code !== "ENOENT"){ throw cleanupError; }
        }
        throw error;
    }

    assertRuntimeSize(executablePath);
    return { executablePath, args: chromiumBundle.args };
}

async function extractBrotliTar(archivePath, outputDirectory){
    await pipeline(
        fs.createReadStream(archivePath),
        createBrotliDecompress({ chunkSize: 2 ** 21 }),
        tar.extract(outputDirectory, { chown: false })
    );
}

function assertRuntimeSize(executablePath){
    const size = fs.statSync(executablePath).size;
    if(size < minimumChromiumBytes){
        throw new Error(`Extracted Chromium runtime is incomplete (${size} bytes).`);
    }
}

module.exports = { resolveChromiumRuntime };
