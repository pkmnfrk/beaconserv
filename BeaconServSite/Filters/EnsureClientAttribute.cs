using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BeaconServSite.Filters
{
    public class EnsureClientAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            base.OnActionExecuting(filterContext);

            Guid clientid = Guid.Empty;
            var cookie = filterContext.HttpContext.Request.Cookies["ClientID"];

            if (cookie != null)
            {
                Guid.TryParse(cookie.Value, out clientid);

            }

            if (clientid == Guid.Empty)
            {
                clientid = Guid.NewGuid();
                cookie = new HttpCookie("ClientID", clientid.ToString());
                filterContext.HttpContext.Response.SetCookie(cookie);
            }

            using (var db = new Context())
            {
                var client = db.Clients.Where(c => c.ClientID == clientid).FirstOrDefault();

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

            
            var controller = filterContext.Controller as IEnsureClientController;
            if (controller != null)
            {
                controller.ClientID = clientid;
            }
            
        }
    }

    public interface IEnsureClientController
    {
        Guid ClientID { set; }
    }
}