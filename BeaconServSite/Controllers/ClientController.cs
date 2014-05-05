using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data.Entity;
using System.Data.Entity.Core.Query;

using BeaconServSite.Filters;
using BeaconServSite.Models;
using BeaconServSite.Code;

namespace BeaconServSite.Controllers
{
    [RoutePrefix("client")]
    public class ClientController : ApiController, IEnsureClientController
    {
        public static DateTime ThirtyMinutesAgo
        {
            get
            {
                return DateTime.Now.AddDays(-1.0);
            }
        }

        [HttpGet]
        [Route("all")]
        public object GetAllClients(int? major = null)
        {
            using (var db = new Context())
            {
                db.Configuration.LazyLoadingEnabled = false;

                var ret = db.Clients.AsQueryable();

                if (major.HasValue)
                {
                    ret = ret.Where(c => c.BeaconPings.Any(q => q.Date >= ThirtyMinutesAgo && q.Beacon.Major == major.Value));
                }
                else
                {
                    ret = ret.Where(c => c.BeaconPings.Any(q => q.Date >= ThirtyMinutesAgo));
                }

                ret = ret.OrderBy(c => c.Name);

               /* foreach (var item in ret)
                {
                    db
                        .Entry(item)
                        .Collection(i => i.BeaconPings)
                        .Query()
                        .Include(q => q.Beacon)
                        .Where(q => q.Date >= thirtyMinutesAgo)
                        .Load();

                }*/

                return ret.ToList();
            }
        }

        [HttpGet]
        [Route("{clientid}")]
        public object GetClient(Guid clientid, int? major = null)
        {
            using (var db = new Context())
            {
                db.Configuration.LazyLoadingEnabled = false;
                db.Configuration.ProxyCreationEnabled = false;

                var client = db.Clients.Find(clientid);

                if (client == null)
                {
                    throw new HttpResponseException(HttpStatusCode.NotFound);
                }

                var subq = db
                    .Entry(client)
                    .Collection(c => c.BeaconPings)
                    .Query()
                    .Include(c => c.Beacon)
                    .Where(c => c.Date >= ThirtyMinutesAgo);

                if (major.HasValue)
                {
                    subq = subq.Where(c => c.Beacon.Major == major.Value);
                }

                subq = subq
                    .OrderBy(c => c.Date);

                subq.Load();

                return client;
            }
        }



        public class SetNameModel
        {
            public string Name { get; set; }
        }

        [HttpPut]
        [Route("my/name")]
        [EnsureClientWebApi]
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
        [EnsureClientWebApi]
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
