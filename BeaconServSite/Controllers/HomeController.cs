using BeaconServSite.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace BeaconServSite.Controllers
{
    //[EnsureClient]
    public class HomeController : Controller, IEnsureClientController
    {
        public ActionResult Index()
        {
            

            return View();
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}
