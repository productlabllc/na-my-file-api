# . ./params.env
rm -rf ./dist
npm run build
cp ../na-my-file-core-sdk-pkg/myfile-core-sdk-0.1.0.tgz ./

# cp ~/.npmrc ./dist
# docker build \
#   --build-arg git_commit=${GIT_COMMIT} \
#   --build-arg git_branch=${GIT_BRANCH} \
#   --build-arg aws_access_key_id=${AWS_ACCESS_KEY_ID} \
#   --build-arg aws_secret_access_key=${AWS_SECRET_ACCESS_KEY} \
#   --build-arg aws_session_token=${AWS_SESSION_TOKEN} \
#   -t test-lambda .