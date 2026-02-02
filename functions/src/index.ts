import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10});

export {generatePost} from "./generate-post";
