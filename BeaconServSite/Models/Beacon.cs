using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace BeaconServSite.Models
{
    public class Beacon
    {
        public string Id { get; set; }
        public Guid UUID { get; set; }
        public int? Major { get; set; }
        public int? Minor { get; set; }

        public string BodyText { get; set; }
        public string Title { get; set; }
        public string Url { get; set; }
        public string Image { get; set; }

        public Beacon()
        {

        }

        public Beacon(Guid g, XElement beacon)
        {
            if (beacon.Attribute("id") != null)
                Id = beacon.Attribute("id").Value;

            UUID = g;
            if(beacon.Attribute("major") != null)
                Major = int.Parse(beacon.Attribute("major").Value);

            if (beacon.Attribute("minor") != null)
                Minor = int.Parse(beacon.Attribute("minor").Value);

            if (beacon.Element("url") != null)
                Url = beacon.Element("url").Value;

            Title = beacon.Element("title").Value;
            BodyText = beacon.Element("body").Value;
            if(beacon.Element("image")!= null)
                Image = beacon.Element("image").Value;
        }

        public static List<Beacon> LoadFromXml(XDocument doc)
        {

            List<Beacon> ret = new List<Beacon>();

            foreach (var uuid in doc.Root.Elements("uuid"))
            {
                Guid g = new Guid(uuid.Attribute("value").Value);

                foreach (var beacon in uuid.Elements("beacon"))
                {
                    Beacon b = new Beacon(g, beacon);
                    
                    ret.Add(b);
                }

                if (uuid.Element("default") != null)
                {
                    Beacon b = new Beacon(g, uuid.Element("default"));


                    ret.Add(b);
                }
            }

            return ret;
        }

        public static XDocument SerializeBeaconList(List<Beacon> beacons)
        {
            var ret = new XDocument(new XElement("beacons"));

            var uuids = beacons.GroupBy(b => b.UUID).OrderBy(b => b.Key);

            foreach(var uuid in uuids) {

                var el = new XElement("uuid", new XAttribute("value", uuid.Key), uuid.OrderBy(b => b.Major).ThenBy(b => b.Minor).Select(u => u.ToXml()));

                ret.Root.Add(el);
            }

            return ret;
        }

        public XElement ToXml()
        {
            var ret = new XElement("beacon");

            if (!string.IsNullOrEmpty(Id))
                ret.Add(new XAttribute("id", Id));

            if(Major.HasValue)
                ret.Add(new XAttribute("major", Major));
            if(Minor.HasValue)
                ret.Add(new XAttribute("minor", Minor));
            if(!string.IsNullOrEmpty(Title))
                ret.Add(new XElement("title", Title));
            if(!string.IsNullOrEmpty(BodyText))
                ret.Add(new XElement("body", BodyText));
            if (!string.IsNullOrEmpty(Url))
                ret.Add(new XElement("url", Url));
            if (!string.IsNullOrEmpty(Image))
                ret.Add(new XElement("image", Image));

            return ret;

        }
    }
}
