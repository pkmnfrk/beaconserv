using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BeaconServSite.Models;

namespace BeaconServSite.Code
{
    public interface IBeaconProvider
    {
        Beacon FindExactBeacon(Guid uuid, int major, int minor);
        Beacon FindBeacon(Guid uuid, int major, int minor);
        Beacon StoreBeacon(Beacon beacon);
        void Persist();

        IDictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> GetAllBeacons();
        IDictionary<int, Dictionary<int, Beacon>> GetBeaconsByUuid(Guid uuid);
        IDictionary<int, Beacon> GetBeaconsByUuidAndMajor(Guid uuid, int major);
    }
}
