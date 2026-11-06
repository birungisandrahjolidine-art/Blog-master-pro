// Single source of truth for the story form limits (shared with the client script)
const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB

const LIMITS = {
    title: { min: 5, max: 120 },
    description: { min: 20, max: 5000 },
    mediaMaxBytes: MAX_MEDIA_BYTES
};

const MESSAGES = {
    titleRequired: 'Please give your story a title.',
    titleShort: `The title needs at least ${LIMITS.title.min} characters.`,
    titleLong: `The title can be at most ${LIMITS.title.max} characters.`,
    descriptionRequired: 'Please write a short description for your story.',
    descriptionShort: `The description needs at least ${LIMITS.description.min} characters.`,
    descriptionLong: `The description can be at most ${LIMITS.description.max} characters.`
};

// Validates and normalises submitted story fields.
// Returns { values, errors, valid } where errors is keyed by field name.
const validateBlogInput = (body = {}) => {
    const title = String(body.title == null ? '' : body.title).trim();
    const description = String(body.description == null ? '' : body.description).trim();
    const errors = {};

    if (title.length < LIMITS.title.min) {
        errors.title = title ? MESSAGES.titleShort : MESSAGES.titleRequired;
    } else if (title.length > LIMITS.title.max) {
        errors.title = MESSAGES.titleLong;
    }

    if (description.length < LIMITS.description.min) {
        errors.description = description ? MESSAGES.descriptionShort : MESSAGES.descriptionRequired;
    } else if (description.length > LIMITS.description.max) {
        errors.description = MESSAGES.descriptionLong;
    }

    return {
        values: { title, description },
        errors,
        valid: Object.keys(errors).length === 0
    };
};

module.exports = { LIMITS, MESSAGES, validateBlogInput };
