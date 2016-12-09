#pggr-site

![logo](https://www.pggr.org/images/logo.png)

pggr-site is the central project behind [PGGR.org](https://www.pggr.org).
##Deploying
To deploy the service, you need `git`, `node 7.2.0`, `npm` and appropriate cloning permissions (Consult me if unsure).

    #Clone repository
    git clone git@github.com:PGGRorg/pggr-site.git
    #Move to directory
    cd pggr-site
    #Install required files
    npm install
    #Import Database
    npm run-script import-db

    #Set sendgrid api key (Linux/MacOS)
    export sendgrid=api_key
    #Set sendgrid api key (Windows)
    setx.exe sendgrid "api_key"

    #Deploy app
    npm start

[More detailed guide](https://github.com/PGGRorg/pggr-site/wiki/Deploying)

##Developing and contributing
[View the wiki here](https://github.com/PGGRorg/pggr-site/wiki/Developing)
