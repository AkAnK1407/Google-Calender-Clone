const notFoundHandler = (_req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Resource not found',
  });
};

module.exports = notFoundHandler;
