class Apierrors extends Error {
    constructor(
             statusCode,
             message = "Internal Server Error",
             errors= [],
             statck = ""

            )
             
    {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.message = message;
        this.data=null
        this.success = false;
    

        if(statck){
            this.stack = statck;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
