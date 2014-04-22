using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using BeaconServSite.Models;

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
                var query = db
                    .Beacons
                    .Where(b => b.UUID == uuid && b.Major == major && b.Minor == minor)
                    .Union(db.Beacons.Where(b => b.UUID == uuid && b.Major == major && b.Minor == 0))
                    .Union(db.Beacons.Where(b => b.UUID == uuid && b.Major == 0))
                    .Union(db.Beacons.Where(b => b.UUID == Guid.Empty));




                return query.FirstOrDefault();
            }
        }

        public Beacon StoreBeacon(Beacon beacon)
        {
            using (var db = new Context())
            {
                var oldBeacon = db.Beacons.Find(beacon.UUID, beacon.Major, beacon.Minor);

                if (oldBeacon != null)
                {
                    db.Beacons.Remove(oldBeacon);
                }

                db.Beacons.Add(beacon);
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