module.exports = {
  setAuthHeader: (context, events, done) => {
    const token = context.vars.accessToken;
    if (!token) {
      return done(new Error('No access token found'));
    }
    context.vars.authHeader = `Bearer ${token}`;
    return done();
  },
};
