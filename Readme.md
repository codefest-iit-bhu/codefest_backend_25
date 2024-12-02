# Codefest'25 - IIT (BHU)

This is the backend for Codefest'25, fest conducted by CSE department of IIT (BHU) Varanasi.

## Setup

- Fork the repository into your account
- Clone the forked repository
- Install the dependencies using the following command:

  ```bash
  npm i
  ```

- Create a .env in the root folder using the .env.example given
- Run the development server using:
  ```bash
  npm run dev
  ```
- Open `http://localhost:{PORT}/api-docs` to see the API documentation

## Contribution

- Create a branch for the task you're assigned with
- Make changes in that branch
- Commit your changes and push to the your forked repo.
- Open a pull request to the upstream (this main repo) and wait for a maintainer to merge your PR.

- Every now and then, do `git fetch --all` and `git rebase upstream/main` to keep your fork synced with the upstream.

- If you can't see upstream in `git remote -v`, do `git remote add upstream "https://github.com/codefest-iit-bhu/codefest_backend_25"` to add the upstream
