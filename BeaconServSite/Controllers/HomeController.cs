using BeaconServSite.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using BeaconServSite.Models;
using BeaconServSite.ViewModel;

namespace BeaconServSite.Controllers
{
    [EnsureClientMVC]
    public class HomeController : Controller, IEnsureClientController
    {
        public ActionResult Index()
        {
            var model = new HomeIndexViewModel();

            return View(model);
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}
