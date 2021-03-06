/*
* Trenton: A small hacky commandline wrangler
*/

const path                                         = require('path')

const { isDarleneFile, isInvalidPath, isDirectory }  = require('./file')

const { FlagError, FilePathError, IVError,
        TagError, OptionError }                    = require('./errors')


// Easily translate some options to metas key
const meta_aliases = {
    'J': 'isJSON',
    'L': 'legacy',
    'm': 'mode',
    'k': 'keylength',
    'x': 'encoding',
    'X': 'exec',
    'c': 'content',
    'C': 'concat',
    'f': 'file',
    'o': 'out',
    's': 'show',
    'e': 'encrypt',
    'd': 'decrypt',
    'i': 'iv',
    't': 'tag',
    'w': 'words'
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
                    '-C',
                    '--concat',
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
                    '-X',
                    '--exec',
                    '-i',
                    '--iv',
                    '-t',
                    '--tag',
                    '-w',
                    '--words',
                    '-E',
                    '--encrypt',
                    '-D',
                    '--decrypt',
                    '-B',
                    '--binary',
                    '-J',
                    '--json',
                    '-L',
                    '--legacy',
                    '-S',
                    '--show' ]

// Our single character flags and their expanded versions
const flags = ['C', 'concat', 'B', 'binary', 'E', 'encrypt', 'D', 'decrypt', 'J', 'json', 'L', 'legacy', 'S', 'show', 'X', 'exec']

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
        // For single letters we go forward
        if (idx % 2 == 0) {
            idx = (idx + 1 == flags.length) || (idx - 1 % 2 == 0) ? idx : idx + 1
        }

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

const squashNums = (str) => {
    return str.replace(new RegExp(/[0-9]+/, 'gi'), '')
              .replace(new RegExp(/ /, 'g'), '')
}

const isNumber = (str) => {
    let retval = false

    if (!squashNums(str)) {
        retval = true
    }

    return retval
}

const checkSemantics = (metas) => {
    // Check whether neither 'encrypt' or 'decrypt' specified
    if (!metas.encrypt && !metas.decrypt) {
        throw new FlagError("must specify either 'encrypt' or 'decrypt' operation")
    }

    // Check whether both 'decrypt' and 'encrypt'
    if (metas.encrypt && metas.decrypt) {
        throw new FlagError("can only specify one operation: encrypt or decypt, not both")
    }

    // Check whether both input file and content provided
    if (metas.content && metas.file) {
        throw new FlagError(`must provide input file path with decrypt flag${metas.isBinary && metas.file ? ' and ' : ''}${metas.isBinary ? 'binary flag' : ''}`)
    }

    // Check that at least an input file provided or raw content to decrypt
    if ((!metas.file && !metas.content) && metas.decrypt) {
        throw new FlagError("must provide at least an input file path or content with decrypt flag")
    }

    // Check dependent options (out <-> encrypt)
    if (metas.out == null && metas.encrypt) {
        throw new FilePathError("must provide filename to write data")
    }

    // Check that darlene file not provided for ecnryption (that would not make sense)
    if (isDarleneFile(metas.file) && metas.encrypt) {
        throw new FileTypeError("cannot encrypt a darlene ('drln') file")
    }

    // Check that concat option provided in proper operation mode (decryption)
    if (metas.concat && !metas.decrypt) {
        throw new FlagError("-C (or --concat) flag can only be used with the -D flag")
    }

    // words (-w or --words) flag can only be used when encrypting
    if ((metas.words > 0) && !metas.encrypt) {
        throw new FlagError("-w (or --words) flag can only be used when encryptng (-E)")
    }

    // must provide a full path with the words path
    if ((metas.words > 0) && (path.extname(metas.out) > 0)) {
        console.log('[Warn] file output path extension would be overwritten to json when the -w (or --words) flag')
    }

    // Check whether IV provoded in decrypt mode
    // Dependent options (iv <-> decrypt) for raw content
    if (metas.iv == null && metas.decrypt && metas.content) {
        throw new IVError("iv must be provided to decrypt data")
    }

    // Check that tag provided in decrypt mode
    // Dependant options (tag <-> decrypt) for raw content
    if (metas.tag == null && metas.decrypt && metas.content) {
        throw new TagError("tag must be provided to decrypt data")
    }

    // Check that both binary and json flag not used together
    if (metas.isBinary && metas.isJSON) {
        throw new FlagError("cannot use both binary (-B) and json (-J) flag")
    }

    // Check that legacy flag only used with decrypt flag
    if (metas.legacy && !metas.decrypt) {
        throw new FlagError("cannot use legacy (-L) flag without decrypt flag (-D)")
    }

    // Check whether '-X' provided with decrypt flag for file
    if (metas.exec && !(metas.decrypt && metas.file)) {
        throw new FlagError("can only use exec (-X) flag in file decryption")
    }

    // Check that the words (-w) flag in the encryption mode (-E)
    // .. and can't be used with the content (-c) or file (-f) flag
    if ((metas.words > 0) && (metas.content || metas.file)) {
        throw new FlagError("-w (or --words) flag cannot be used with the content (-c) or file (-f) flag")
    }

    // Log warning to alert the user of redundant behaviour
    // If '-w' flag (words) is used with '-J' to encrypt its quite redundant
    // ... as we already treat is as JSON
    if (metas.encrypt && (metas.words > 0) && metas.isJSON) {
        console.log('[Warn] input is already encrypted as JSON when -w or --words flag used')
    }

    // Raw content needs full output path to be specified
    if (metas.content && isDirectory(metas.out)) {
        throw new FilePathError("must specify a full output (with extension) with -c flag")
    }

    // Warn user that 'mode', 'keylength', 'iv', 'tag', 'encoding', 'isJSON' & 'ext'
    // ... would be replaced by data in darlene file
    if ((metas.mode || meta.keylength || metas.iv || metas.tag || metas.encoding || metas.isJSON || metas.isBinary) && 
    (isDarleneFile(metas.file))) {
        console.log('[Warn] values for mode, keylength, iv, tag, encoding, isJSON & isBinary\n\twould be overridden by darlene content\n')
    }

    // Check that the input file path is specific
    if (isInvalidPath(metas.file)) {
        throw new FilePathError("input file must be more specific than '.'")
    }

    // Check that the input file path is specific
    if (metas.words > 0 && isInvalidPath(metas.out)) {
        throw new FilePathError("output file must be more specific than '.'")
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
        exec: false,
        file: null,
        out: null,
        content: null,
        words: 0, // Actual count of words to encrypt, for wallet mnemonics and such
        concat: false,
        legacy: false,
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
                switch (obj.arg) {
                    case 'binary':
                        metas.isBinary = true
                        break

                    case 'exec':
                        metas.exec     = true
                        break

                    case 'encrypt':
                        metas.encrypt  = true
                        break

                    case 'decrypt':
                        metas.decrypt  = true
                        break

                    case 'json':
                        metas.isJSON   = true
                        break

                    case 'legacy':
                        metas.legacy   = true
                        break

                    default:
                        // Other metas are updating by direct indexing
                        // ... since the 'arg' is expanded and matches the keys
                        metas[obj.arg] = isNumber(String(obj.value)) ? Number(obj.value) : obj.value
                        break
                }
    
                // Instead of a single increment
                // We increment beyond the argument's value
                i += (1 + obj.inc)
            } else {
                // Prints whether no value was provided for a flag or 
                // whether an invalid value was provided with a certain flag
                throw new FlagError(`flag '${stripArg(obj.arg)}' requires ${obj.invalid ? 'value of either' : 'an argument'} ${obj.invalid ? joinArray(obj.valids) : ''}`)
            }
        } else {
            // Alerts user that the option does not exist
            throw new OptionError(`invalid option '${stripArg(args[i])}'`)
        }
    }
  
    return metas

}

module.exports = { buildMeta, sanitizeArgs, checkSemantics }
