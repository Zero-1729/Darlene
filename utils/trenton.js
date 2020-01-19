/*
* Trenton: A small hacky commandline wrangler
*/

const path = require('path')

const { isDarleneFile, isValidPath } = require('./file')

// Easily translate some options to metas key
const meta_aliases = {
    'J': 'isJSON',
    'm': 'mode',
    'k': 'keylength',
    'x': 'encoding',
    'c': 'content',
    'f': 'file',
    'o': 'out',
    's': 'show',
    'e': 'encrypt',
    'd': 'decrypt',
    'i': 'iv',
    't': 'tag'
}

// To manage valid option arguments
valid_required_values = {
    'keylength': ['128', '192', '256'],
    'encoding': ['hex', 'base64'],
    'mode': ['cbc', 'gcm']
}

// All valid options and flags
const valid_args = [ '-h',
                    '--help',
                    '-c', 
                    '--content',
                    '-f',
                    '--file',
                    '-o',
                    '--out',
                    '-m',
                    '--mode',
                    '-k',
                    '--keylength',
                    '-x',
                    '--encoding',
                    '-i',
                    '--iv',
                    '-t',
                    '--tag',
                    '-E',
                    '--encrypt',
                    '-D',
                    '--decrypt',
                    '-B',
                    '--binary',
                    '-J',
                    '--json',
                    '-S',
                    '--show' ]

// Our single character flags and their expanded versions
const flags = ['B', 'binary', 'E', 'encrypt', 'D', 'decrypt', 'J', 'json', 'S', 'show']

const joinArray = (arr) => {
    // Function returns a stringified array in the form '<elm>, <elm>, ... or <elm>'
    if (arr.length > 1) {
        let str = arr.slice(0, arr.length-1).join(', ')

        if (arr.length > 2) {
            str += ' or ' + arr[arr.length - 1]
        }

        return str
    } else {
        return arr.toString()
    }
}

const getValue = (args, idx) => {
    // Returns the value of an argument if available
    // ... else it throws an error
    let raw_arg = stripArg(args[idx])
    let arg = raw_arg.replace((new RegExp('-', 'g')), '') // Get stripped arg

    // If its a flag that doesn't require an argument then we simply return arg
    if (flags.includes(arg)) {
        let idx = flags.indexOf(arg)

        // expand single flag name
        // E.g. 'B' -> 'binary'
        idx = (idx + 1 == flags.length) || (idx - 1 % 2 == 0) ? idx : idx + 1

        // Remember including a flag sets the value to true
        return {arg: flags[idx], value: true, inc: 0, ret_val: 0, invalid: false, valids: []}
    }

    // expand single flag names
    // E.g. 'f' -> 'file'
    if (Object.keys(meta_aliases).includes(arg)) {
        arg = arg.length == 1 ? meta_aliases[arg] : arg
    }

    // Check if the option carries an arg
    let nidx = idx+1

    if (nidx >= args.length) {
        return {arg: raw_arg, value: `'<${arg}>'`, inc: null, ret_val: 1, invalid: false, valids: []}
    }

     // Check if arguments 'keylength', 'encoding', and 'mode' are valid
     if (Object.keys(valid_required_values).includes(arg)) {
        if (!valid_required_values[arg].includes(args[nidx])) {
            return {arg: raw_arg, value: `'<${arg}>'`, inc: null, ret_val: 1, invalid: true, valids: valid_required_values[arg]}
        }
    }

    return {arg: arg, value: args[nidx], inc: 1, ret_val: 0, invalid: false, valids: []}
}

const stripArg = (str) => {
    let arg = str

    // Watch out for potential use of flags with '='
    // E.g. --content="Hello" or -c="Hello"
    if (arg.match(/^-(-)?.+=/)) {
        // extract the command
        arg = arg.replace(/=.+/, '')
    }

    return arg
}

const stripValue = (str) => {
    let val = str

    if (str.match(/^-(-)?.+=/)) {
        // Fetch value after '='
        val = str.replace(/^-(-)?.+=/, '')
    }

    return val
}

const sanitizeArgs = (args) => {
    let newArgs = []

    for (var i = 0;i < args.length;i++) {
        // Do we have '--<cmd>=val'
        if (args[i].match(/^-(-)?.+=/)) {
            // If so, we have to extract the arg from the value
            newArgs.push(stripArg(args[i]))
            newArgs.push(stripValue(args[i]))
        } else {
            // If not, most likely separated by newlines
            // ... so we just return it the way it is
            newArgs.push(args[i])
        }
    }

    return newArgs
}

const isNumber = (str) => {
    let retval = false

    if (str.match(/[0-9]+/)) {
        retval = str.match(/[0-9]+/).index == 0 ? true : false
    }

    return retval
}

const checkSemantics = (metas) => {
    // Check whether neither 'encrypt' or 'decrypt' specified
    if (!metas.encrypt && !metas.decrypt) {
        throw `darlene: must specify either 'encrypt' or 'decrypt' operation.`
    }

    // Check whether both 'decrypt' and 'encrypt'
    if (metas.encrypt && metas.decrypt) {
        throw `darlene: can only specify one operation: encrypt or decypt, not both.`
    }

    // Check whether both input file and content provided
    if (metas.content && metas.file) {
        throw `darlene: must provide input file path with decrypt flag${metas.isBinary && metas.file ? ' and ' : ''}${metas.isBinary ? 'binary flag' : ''}`
    }

    // Check that at least an input file provided or raw content to decrypt
    if ((!metas.file && !metas.content) && metas.decrypt) {
        throw `darlene: must provide at least an input file path or content with decrypt flag`
    }

    // Check dependent options (out <-> encrypt)
    if (metas.out == null && metas.encrypt) {
        throw `darlene: must provide filename to write data`
    }

    // Check that darlene file not provided for ecnryption (that would not make sense)
    if (isDarleneFile(metas.file) && metas.encrypt) {
        throw `darlene: cannot encrypt a darlene ('drln') file`
    }

    // Check whether IV provoded in decrypt mode
    // Dependent options (iv <-> decrypt) for raw content
    if (metas.iv == null && metas.decrypt && metas.content) {
        throw `darlene: iv must be provided to decrypt data.`
    }

    // Check that tag provided in decrypt mode
    // Dependant options (tag <-> decrypt) for raw content
    if (metas.tag == null && metas.decrypt && metas.content) {
        throw `darlene: tag must be provided to decrypt data`
    }

    // Check that input file provided when binary and or encrypt flags on
    if ((metas.isBinary || metas.encrypt) && !metas.content && (!metas.file)) {
        throw `darlene: must provide input file path with decrypt flag${metas.isBinary && metas.file ? ' and ' : ''}${metas.isBinary ? 'binary flag' : ''}`
    }

    // Check whether non darlene file provided with decrypt op
    if ((metas.decrypt) && (!isDarleneFile(metas.file) && metas.content == null)) {
        throw `darlene: can only decrypt '.drln' files and raw content (see '-c' flag usage)`
    }

    // Check that both binary and json flag not used together
    if (metas.isBinary && metas.isJSON) {
        throw `darlene: cannot use both binary (-B) and json (-J) flag.`
    }

    // Raw content needs full output path to be specified
    if (metas.content && (path.extname(metas.out)).length == 0) {
        throw `darlene: must specify a full output (with extension) with -c flag`
    }

    // Warn user that 'mode', 'keylength', 'iv', 'tag', 'encoding', 'isJSON' & 'ext'
    // ... would be replaced by data in darlene file
    if ((metas.mode || meta.keylength || metas.iv || metas.tag || metas.encoding || metas.isJSON || metas.isBinary) && 
    (isDarleneFile(metas.file))) {
        console.log('darlene: [warn] values for mode, keylength, iv, tag, encoding, isJSON & isBinary would be overridden by darlene content')
    }

    // Check that the input file path is specific
    if (isValidPath(metas.file)) {
        throw `darlene: input file must be more specific than '.'`
    }

    // Check that output file path is specific
    if (isValidPath(metas.out)) {
        throw `darlene: output file must be more specific than '.'`
    }
}

const buildMeta = (args) => {
    // Default values for metas
    let metas = {
        mode: 'gcm',
        keylength: 256,
        encoding: 'hex',
        iv: null,
        isJSON: false,
        isBinary: false,
        file: null,
        out: null,
        content: null,
        show: false,
        encrypt: false,
        decrypt: false
    }

    let i = 0

    // Main work done here
    // Traversing the args and updating the metas accordingly
    while (i < args.length) {
        if (valid_args.includes(args[i])) {
            let obj = getValue(args, i)

            if (obj.ret_val == 0) {
                // Special case for 'binary' flag
                // Since it determins the file content type
                // ... we have to set the 'ext' to true and then fill later
                // ... this way, Darlene can handle the file contents properly when encrypting/decryprting
                if (obj.arg == 'binary') {
                    metas.isBinary = true
                } else if (obj.arg == 'encrypt') {
                    metas.encrypt = true
                } else if (obj.arg == 'decrypt') {
                    metas.decrypt = true
                } else {
                    // Other metas are updating by direct indexing
                    // ... since the 'arg' is expanded and matches the keys
                    metas[obj.arg] = isNumber(String(obj.value)) ? Number(obj.value) : obj.value
                }
    
                // Instead of a single increment
                // We increment beyond the argument's value
                i += (1 + obj.inc)
            } else {
                // Prints whether no value was provided for a flag or 
                // whether an invalid value was provided with a certain flag
                throw `darlene: flag '${stripArg(obj.arg)}' requires ${obj.invalid ? 'value of either' : 'an argument'} ${obj.invalid ? joinArray(obj.valids) : ''}`
            }
        } else {
            // Alerts user that the option does not exist
            throw `darlene: invalid option '${stripArg(args[i])}'`
        }
    }
  
    return metas

}

module.exports = { buildMeta, sanitizeArgs, checkSemantics }
