import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

initializeApp();
setGlobalOptions({maxInstances: 10});

// Generate Post features
export {
  generatePost,
  editPost,
  generatePostImages,
  finalizePostImages,
} from "./features/generate-post";

// Draft features
export {
  saveDraft,
  loadDraft,
  deleteDraft,
} from "./features/draft";

// Delete Post
export {deletePost} from "./features/delete-post";

// Admin features
export {setRole} from "./set-role";
export {getUserByEmail} from "./get-user-by-email";

// Sitemap
export {generateSitemap, sitemap} from "./sitemap";
