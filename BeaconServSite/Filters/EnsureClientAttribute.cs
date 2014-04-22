using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BeaconServSite.Filters
{
    public class EnsureClientMVCAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            base.OnActionExecuting(filterContext);

            EnsureClientMVCAttribute.Logic(HttpContext.Current, filterContext.Controller as IEnsureClientController);
            
        }

        internal static void Logic(HttpContext context, IEnsureClientController controller)
        {
            Guid clientid = Guid.Empty;
            var cookie = context.Request.Cookies["ClientID"];

            if (cookie != null)
            {
                Guid.TryParse(cookie.Value, out clientid);
            }

            if (clientid == Guid.Empty)
            {
                clientid = Guid.NewGuid();
            }

            cookie = new HttpCookie("ClientID", clientid.ToString());
            cookie.Domain = context.Request.Url.Host;
            cookie.Expires = DateTime.Now.AddYears(1);
            cookie.HttpOnly = true;
            context.Response.SetCookie(cookie);

            using (var db = new Context())
            {
                var client = db.Clients.Find(clientid);

                if (client == null)
                {
                    client = new Client
                    {
                        ClientID = clientid
                    };
                    
                    db.Clients.Add(client);

                    db.SaveChanges();
                }
            }

            
            if (controller != null)
            {
                controller.ClientID = clientid;
            }
        }
    
    }

    public class EnsureClientWebApiAttribute : System.Web.Http.Filters.ActionFilterAttribute
    {
        public override void OnActionExecuting(System.Web.Http.Controllers.HttpActionContext actionContext)
        {
            
            EnsureClientMVCAttribute.Logic(HttpContext.Current, actionContext.ControllerContext.Controller as IEnsureClientController);
            

        }
    }

    public interface IEnsureClientController
    {
        Guid ClientID { set; }
    }
}