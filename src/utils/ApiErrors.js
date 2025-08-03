class Apierrors extends Error {
    constructor(
             statusCode,
             message = "Internal Server Error",
             errors= [],
             stack = ""

            )
             
    {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.message = message;
        this.data=null
        this.success = false;
    

        if(statk){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

