pkgname=experiment-3
pkgver=0.2.1
pkgrel=1
pkgdesc="Plugin for downloading content from websites"
arch=('x86_64')
extension_file="${pkgname}@example.com.xpi"

build(){
    cd $startdir
    npm run build
    cd $startdir/dist
    zip -r ../$extension_file *
}

package() {
    install -d $pkgdir/usr/lib/firefox-developer-edition/browser/extensions/
    install -d $pkgdir/usr/lib/firefox/browser/extensions

    install -t $pkgdir/usr/lib/firefox-developer-edition/browser/extensions/ $startdir/$extension_file
    ln -s /usr/lib/firefox-developer-edition/browser/extensions/$extension_file $pkgdir/usr/lib/firefox/browser/extensions/
    rm $startdir/*.xpi

}

