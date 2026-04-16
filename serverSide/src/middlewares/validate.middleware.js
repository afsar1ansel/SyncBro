export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    console.error('Validation Error:', error);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues?.map((err) => ({
        path: err.path,
        message: err.message,
      })) || [{ message: error.message }],
    });
  }
};
