import CryptoJS from "crypto-js";
import BigInt from 'big-integer'
const ONE = BigInt.one
const ZERO = BigInt.zero

// Generate x1 by randomly choosing a number between 0 and q - 1
export const generateX1 = (q) => {
    const min = ZERO
    const max = BigInt(q.subtract(ONE))
    return BigInt.randBetween(min, max)
}

// Generate x2 by randomly choosing a number between 1 and q - 1
export const generateX2 = (q) => {
    const min = ONE
    const max = q.subtract(ONE)
    return BigInt.randBetween(min, max)
}

// Convert a password string to a big interger by converting it to a hexadecimal using hash function SHA 2
// then convert hexadecimal to big integer 
export const generateS = (password) => {
    const hashedPass = CryptoJS.SHA256(password)
    return BigInt(hexTodecimal(hashedPass.toString(CryptoJS.enc.Hex)))
}

// Round 1: Compute gx with 
export const computeGX = (p, g, x) => {
    return BigInt(g.modPow(x, p))
}

// Round 2: Compute first part of A
export const computeGA = (p, gx1, gx3, gx4) => {
    return BigInt(gx1.multiply(gx3).multiply(gx4).mod(p))
}

// Round 2: Compute second part of A
export const computeX2S = (q, x2, s) => {
    return BigInt(x2.multiply(s).mod(q))
}

// Round 2: Compute A
export const computeA = (GA, p, X2S ) => {
    return BigInt(GA.modPow(X2S, p))
}

// Compute schnorr's non-interactive zero knowledge proof
export const computeZeroKnowledgeProof = (p, q, g, gx, x, user_id) => {
    let zeroKnowledgeProof = new Array()
    let min = ZERO
    let max = BigInt(q.subtract(ONE))
    let v =  BigInt.randBetween(min, max)
    let gv = BigInt(g.modPow(v, p))
    let h = computeHash(g, gv, gx, user_id)

    zeroKnowledgeProof.push(gv.toString())
    zeroKnowledgeProof.push(v.subtract(x.multiply(h)).mod(q).toString())

    return zeroKnowledgeProof
}

// Compute hash for zero knowledge proof using 256-bits SHA 2 hashing algorithm
export const computeHash = (g, gv, gx, user_id) => {
    var sha256 = CryptoJS.algo.SHA256.create();
    sha256.update(g.toString());
    sha256.update(gv.toString());
    sha256.update(gx.toString());
    sha256.update(user_id.toString());
    var hash = sha256.finalize();
    return BigInt(hexTodecimal(hash.toString(CryptoJS.enc.Hex)))
}

// Function to compute zero knowledge proof of other user's value with local information
export const validateZeroKnowledgeProof = (p, q, g, gx, zeroKnowledgeProof, user_id) => {
    let gv = BigInt(zeroKnowledgeProof[0])
    let r = BigInt(zeroKnowledgeProof[1])
    let h = computeHash(g, gv, BigInt(gx), user_id)

    if (!(BigInt(gx).compareTo(ZERO) == 1 && BigInt(gx).modPow(q, p).compareTo(ONE) == 0 &&
        g.modPow(r, p).multiply(BigInt(gx).modPow(h, p)).mod(p).compareTo(gv) == 0)){
        return false
    }
    return true
}

// Function to compute the keying material
export function computeKeyingMaterial(p, q, gx4, x2, s, B) {
    const negativeX2S = '-' + x2.multiply(s).toString()
    return BigInt(gx4).modPow(BigInt(negativeX2S).mod(q), p).multiply(BigInt(B)).modPow(x2, p)
}

// Function to compute the HMAC code using gx1, gx2, gx3, gx4 and keying material
export function computeHMACVerification(keyingMaterial, gx1, gx2, gx3, gx4) {
    var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, keyingMaterial);
    hmac.update(gx1.toString())
    hmac.update(gx2.toString())
    hmac.update(gx3.toString())
    hmac.update(gx4.toString())
    var hash = hmac.finalize();
    return hash.toString(CryptoJS.enc.Hex)
}

// Function convert a hexadecimal in the form of a string into an integer value as a string 
hexTodecimal = (s) => {
    function add(x, y) {
        var c = 0, r = [];
        var x = x.split('').map(Number);
        var y = y.split('').map(Number);
        while(x.length || y.length) {
            var s = (x.pop() || 0) + (y.pop() || 0) + c;
            r.unshift(s < 10 ? s : s - 10); 
            c = s < 10 ? 0 : 1;
        }
        if(c) r.unshift(c);
        return r.join('');
    }

    var dec = '0';
    s.split('').forEach(function(chr) {
        var n = parseInt(chr, 16);
        for(var t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if(n & t) dec = add(dec, '1');
        }
    });
    return dec;
  }

  