import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validateRequest = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'validateRequest.ts:5',message:'Validation middleware entry',data:{path:req.path,method:req.method,bodyType:Array.isArray(req.body)?'array':typeof req.body,bodyLength:Array.isArray(req.body)?req.body.length:Object.keys(req.body||{}).length,query:req.query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    try {
      const validationData = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'validateRequest.ts:7',message:'Before schema validation',data:{validationData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      await schema.parseAsync(validationData);
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'validateRequest.ts:12',message:'Validation passed',data:{path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      return next();
    } catch (error) {
      // #region agent log
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'validateRequest.ts:13',message:'Validation error caught',data:{isZodError:error instanceof ZodError,errorMessage:error instanceof Error?error.message:String(error),issues:error instanceof ZodError?error.issues.map(i=>({path:i.path,message:i.message})):undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.slice(1).join('.'),
          message: issue.message,
        }));
        return res.sendBadRequest('Validation failed', errorMessages);
      } else {
        return next(error);
      }
    }
  };
};
