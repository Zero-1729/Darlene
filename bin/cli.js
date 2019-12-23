#!/usr/local/bin/node

const { buildMeta, sanitizeArgs } = require('../utils/trenton')

console.log('-------------')
console.log('Darlene CLI')
console.log('-------------\n')

const help = () => {
    console.log('Available options:\n')
    console.log('-h  --help\t\targs: - \t\tPrint this message.\n\n\t\t\tNote: should be used without other options.\n\n')
    console.log('-c  --content\t\targs: <string> \t\tSpecify raw text to encrypt\n\n\t\tNote: specifying output path for file is optional when this flag is used\n\n')
    console.log('-f  --file\t\targs: <filepath> \t\tSpecify file to read from.\n\n\t\t\tNote: Option required.\n\n')
    console.log("-o  --out\t\targs: <filepath> \t\tSpecify where to write darlene file.\n\n\t\t\tDefaults to writing output file in the current directory.\n\n")
    console.log("-m  --mode\t\targs: <mode> \t\tSpecify the specific AES mode, value is either 'gcm' or 'cbc'.\n\n\t\t\tDefaults to 'gcm' if this flag not specified.\n\n")
    console.log("-k  --keylength\t\targs: <keylength> \t\tSpecify the key length, values are '128', '196', '256'.\n\n\t\t\tDefaults to '256' if this flag not specified.\n\n")
    console.log("-e  --encoding\t\targs: <encoding> \t\tSpecify the encoding fo hash(es), values are either 'hex' or 'base64'.\n\n\t\t\tDefaults to 'hex' if this flag not specified.\n\n")
    console.log("-J  --json\t\targs: - \t\tFlag to indicate content type of plain text.\n\n\t\t\tDefaults to false when left out.\n\n")
    console.log("-S  --show\t\targs: - \t\tFlag to show contents of file written.\n\n\t\t\tDefaults to false when left out.")
    console.log("-B  --binary\t\targs: - \t\tFlag to indicate the input file is a binary file.\n\n\t\t\tDefaults to false when left out")

    console.log("\nExamples:")
    console.log("\n\tdarlene -c 'Hello world' --show")
    console.log("\tdarlene --content='Hello world' -o . --show") // REM: Creates a 'txt' file by default
    console.log("\n\tdarlene -f plain.txt -k 196")
    console.log("\tdarlene -f crypted.drln -o ~/Documents/ --mode cbc --keylength 128")
    console.log("\tdarlene -f image.png -B -o ~/Pictures -e base64\n")
}

/* Inspect file ext to determine whether we are decrypting or encrypting; if '-o' flag present then its encrypting */
/* Get args and pass it to trenton and get the metas */
/* Read contents of file */
/* Call the proper encrypt/decrypt */
/* Handle unknown commands */
/* Report if value not standard or missing */

// Our synthetic main fn
(() => {
    // We have to sanitize the args to make building the meta easier
    const args = sanitizeArgs(process.argv.slice(2))

    // If no args provided or the help flag is included we print the help message
    if (args.length == 0 || args.includes('-h') || args.includes('--help')) {
        help()
    } else {
        try {
            // Meta needed by Darlene
            let metas = buildMeta(args)

            console.log(metas)
        } catch (e) {
            // Print errors
            console.log(e)
            console.log("use -h flag to print list of options and usage")
        }
    }
})()
