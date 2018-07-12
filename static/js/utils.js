/**
 * @file Some useful functions
 */

/**
 * Round a float number with the number of decimals you want
 * @param {float} floatNumber 
 * @param {integer} decimals 
 */
function round(floatNumber, decimals){
	return parseFloat(floatNumber).toFixed(decimals);
}
