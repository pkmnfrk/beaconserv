using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Drawing;
using System.IO;
namespace MapChop
{
    class Program
    {
        static void Main(string[] args)
        {
            var sourceImagePath = args[0];
            var destFolder = args[1];

            if (Directory.Exists(destFolder))
            {
                try
                {
                    Directory.Delete(destFolder, true);
                    Directory.CreateDirectory(destFolder);
                }
                catch
                {

                }
            }

            int tileSize = 256;
            

            Size destSize = new Size(tileSize, tileSize);
            int sourceSize = tileSize;

            Image sourceImage = Image.FromFile(sourceImagePath);
            while (sourceSize < Math.Min(sourceImage.Width, sourceImage.Height))
            {
                sourceSize *= 2;
            }

            int zoom = 0;
            while (sourceSize >= tileSize)
            {
                Console.WriteLine("{0} -> {1}", sourceSize, tileSize);
                var chopper = new Chopper(new Size(sourceSize, sourceSize), destSize);
                var path = Path.Combine(destFolder, zoom.ToString());

                chopper.Go(sourceImage, path);

                zoom += 1;
                sourceSize /= 2;
            }
        }
    }
}
