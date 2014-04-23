using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data.Entity.Core.Query;

using BeaconServSite.Filters;
using BeaconServSite.Models;
using BeaconServSite.Code;

namespace BeaconServSite.Controllers
{
    [EnsureClientWebApi]
    [RoutePrefix("client")]
    public class ClientController : ApiController, IEnsureClientController
    {
        [HttpGet]
        [Route("all")]
        public object GetAllClients()
        {
            var beacons = TypeResolver.IBeaconProvider;

            using (var db = new Context())
            {
                db.Configuration.LazyLoadingEnabled = false;

                var thirtyMinutesAgo = DateTime.Now.AddMinutes(-30.0);
                var ret = db.Clients
                    .Where(c => c.BeaconPings.Any(q => q.Date >= thirtyMinutesAgo))
                    .OrderBy(c => c.Name)
                    .ToList()
                    .Select(c => new
                    {
                        Name = c.Name ?? "Unknown",
                        LatestPing = db.BeaconPings.Include("Beacon").Where(b => b.Client.ClientID == c.ClientID).OrderByDescending(b => b.Date).FirstOrDefault()
                    })
                    
                    .ToList();

                return ret;
            }
        }

        public class SetNameModel
        {
            public string Name { get; set; }
        }

        [HttpPut]
        [Route("my/name")]
        public void PutName(SetNameModel model)
        {
            using (var db = new Context())
            {
                var me = db.Clients.Find(ClientID);
                me.Name = model.Name;
                db.SaveChanges();
            }
        }

        [HttpGet]
        [Route("my/name")]
        public string GetName()
        {
            using (var db = new Context())
            {
                var me = db.Clients.Find(ClientID);
                return me.Name;
            }
        }

        public Guid ClientID
        {
            get;
            set;
        }
    }
}
