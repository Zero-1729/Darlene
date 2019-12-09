const Matches = (a, b) => {
    if (a.length != b.length) {
        throw new Error("[Error] Arrays length must be the same")
    }

    let same = true

    for (var i = 0;i < a.length;i++) {
        if (a[i] != b[i]) {
            same = false
        }
    }

    return same
}

module.exports = { Matches }
