class FileTypeError extends Error {
    // Error when DRLN file encryption attempted
    constructor(message) {
        super(message)
        this.name = 'FileTypeError'
    }
}

class IVError extends Error {
    // Errors related to the Initialization Vector (IV) and its usage
    constructor(message) {
        super(message)
        this.name = 'IVError'
    }
}

class TagError extends Error {
    // Errors related to AES checksum tags and their usage
    constructor(message) {
        super(message)
        this.name = 'TagError'
    }
}

class FilePathError extends Error {
    // Errors related to improper file paths
    constructor(message) {
        super(message)
        this.name = 'FilePathError'
    }
}

class OptionError extends Error {
    // Error related to CLI options and their usage
    constructor(message) {
        super(message)
        this.name = 'OptionError'
    }
}

class FlagError extends Error {
    // Errors related to flags and their usage
    constructor(message) {
        super(message)
        this.name = 'FlagError'
    }
}

class ArrayLengthError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ArrayLengthError'
    }
}

class EncodingError extends Error {
    constructor(message) {
        super(message)
        this.name = 'EncodingError'
    }
}

class KeylengthError extends Error {
    constructor(message) {
        super(message)
        this.name = 'KeylengthError'
    }
}

class DecipherError extends Error {
    constructor(message) {
        super(message)
        this.name = 'DecipherError'
    }
}

class AuthError extends Error {
    // Errors related to AES (GCM mode) Tag Authentication
    constructor(message) {
        super(message)
        this.name = "AuthError"
    }
}

class FileError extends Error {
    // Errors related to the contents of a DRLN file
    constructor(message) {
        super(message)
        this.name = 'FileError'
    }
}

class EmptyFileError extends Error {
    constructor(message) {
        super(message)
        this.name = 'EmptyFileError'
    }
}

module.exports = { FileTypeError, IVError, TagError, FilePathError, OptionError,
                   FlagError, ArrayLengthError, EncodingError, KeylengthError,
                   DecipherError, AuthError, FileError, EmptyFileError }