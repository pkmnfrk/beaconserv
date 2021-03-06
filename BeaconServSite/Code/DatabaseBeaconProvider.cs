﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BeaconServSite.Models;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;

namespace BeaconServSite.Code
{
    public class DatabaseBeaconProvider : IBeaconProvider
    {
        public Beacon FindExactBeacon(Guid uuid, int major, int minor)
        {
            using (var db = new Context())
            {
                return db.Beacons.Find(uuid, major, minor);
            }
        }

        public Beacon FindBeacon(Guid uuid, int major, int minor)
        {
            using (var db = new Context())
            {
                var ret = db.Beacons.Find(uuid, major, minor);

                if(ret == null) ret = db.Beacons.Find(uuid, major, 0);
                if(ret == null) ret = db.Beacons.Find(uuid, 0, 0);
                if(ret == null) ret = db.Beacons.Find(Guid.Empty, 0, 0);

                return ret;
            }
        }

        public Beacon StoreBeacon(Beacon beacon)
        {
            using (var db = new Context())
            {
                var oldBeacon = db.Beacons.Find(beacon.UUID, beacon.Major, beacon.Minor);

                if (oldBeacon != null)
                {

                    ((IObjectContextAdapter)db).ObjectContext.Detach(oldBeacon);
                    db.Beacons.Attach(beacon);
                    db.Entry(beacon).State = System.Data.Entity.EntityState.Modified;
                }
                else
                {
                    db.Beacons.Add(beacon);
                }

                db.SaveChanges();

                return oldBeacon;
            }
        }

        public void Persist()
        {
            //no-op, since the database handles saving for us
        }

        public IDictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> GetAllBeacons()
        {
            using (var db = new Context())
            {
                var ret = db.Beacons
                    .GroupBy(b => b.UUID)
                    .ToDictionary(b => b.Key, b => b
                        .GroupBy(c => c.Major)
                        .ToDictionary(c => c.Key, c => c
                            .ToDictionary(d => d.Minor, d => d)
                         )
                    )
                ;

                return ret;
            }
        }

        public IDictionary<int, Dictionary<int, Beacon>> GetBeaconsByUuid(Guid uuid)
        {
            using (var db = new Context())
            {
                var ret = db.Beacons.Where(b => b.UUID == uuid).GroupBy(c => c.Major).ToDictionary(c => c.Key, c => c.ToDictionary(d => d.Minor, d => d));
                return ret;
            }
        }

        public IDictionary<int, Beacon> GetBeaconsByUuidAndMajor(Guid uuid, int major)
        {
            using (var db = new Context())
            {
                var ret = db.Beacons.Where(b => b.UUID == uuid && b.Major == major).ToDictionary(d => d.Minor, d => d);
                return ret;
            }
        }
    }
}