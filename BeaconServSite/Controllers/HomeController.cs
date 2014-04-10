using BeaconServSite.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using BeaconServSite.Models;

namespace BeaconServSite.Controllers
{
    [EnsureClient]
    public class HomeController : Controller, IEnsureClientController
    {
        public ActionResult Index()
        {
            using (var db = new Context())
            {
                var c = db.Beacons.Count();
            }

            return View();
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}
