/**
 * Extracts a string error message from an unknown error object.
 *
 * @param {unknown} error - The error object to extract the message from.
 * @returns {string} A string representation of the error message.
 *
 * @description
 * If the error is an instance of Error, it returns the error message along with the stack trace (if available).
 * For non-Error objects, it returns the string representation of the error.
 *
 * @example
 * const error = new Error('Something went wrong');
 * const errorMessage = getErrorMessage(error);
 * console.log(errorMessage); // Outputs: "Something went wrong\n[stack trace]"
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ? `${error.message}\n${error.stack}` : error.message;
  }
  return String(error);
};
