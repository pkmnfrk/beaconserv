using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
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
                var thirtyMinutesAgo = DateTime.Now.AddMinutes(-30);
                return db.Clients
                    //.Where(c => c.BeaconPings.Any(q => q.Date >= thirtyMinutesAgo))
                    .OrderBy(c => c.Name)
                    .Select(c => new {
                        Name = c.Name ?? "Unknown",
                        LatestPing = c.BeaconPings.OrderByDescending(b => b.Date).FirstOrDefault()
                    })
                    .ToList()
                    .Select(c => new
                    {
                        c.Name,
                        LatestPing = c.LatestPing != null ? beacons.FindExactBeacon(c.LatestPing.UUID, c.LatestPing.Major, c.LatestPing.Minor) : null
                    })
                    .ToList();
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
