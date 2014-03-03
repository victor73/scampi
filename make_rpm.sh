#!/bin/bash

NAME=scampi
VERSION=0.3
RPM_RELEASE=2
ARCH=noarch

# Do some token replacement on the .spec token file
cat $NAME.spec.template | sed -e "s/@NAME@/$NAME/" \
     -e "s/@RELEASE@/$RPM_RELEASE/" \
     -e "s/@VERSION@/$VERSION/" > $NAME.spec

TMPDIR=`mktemp -d`
mkdir $TMPDIR/"$NAME-$VERSION"
cp -p $NAME.js $TMPDIR/"$NAME-$VERSION"
cp -p forked.js $TMPDIR/"$NAME-$VERSION"
cp -pr conf $TMPDIR/"$NAME-$VERSION"
cp -pr node_modules $TMPDIR/"$NAME-$VERSION"
cp -pr examples $TMPDIR/"$NAME-$VERSION"
cp -pr rpm $TMPDIR/"$NAME-$VERSION"

if [ -f "$NAME-$VERSION.tar.gz" ]; then
  rm $NAME-$VERSION.tar.gz
fi

# Define the rpm topdir directory as the current directory, parallel with the
# spec file.
RPMTMP=rpm_tmp
mkdir -p $RPMTMP/BUILD $RPMTMP/SOURCES $RPMTMP/RPMS $RPMTMP/SPECS

tar --preserve-permissions --directory $TMPDIR -zcvf $NAME-$VERSION.tar.gz  "$NAME-$VERSION"

# Copy the tarball to the SOURCES directory, where rpmbuild will look for it.
mv $NAME-$VERSION.tar.gz $RPMTMP/SOURCES

rpmbuild -bb --define="_topdir $PWD/$RPMTMP" $NAME.spec

if [ $? == "0" ]; then
    cp $RPMTMP/RPMS/$ARCH/*.rpm $PWD && rm -rf "$RPMTMP"
    rm $NAME.spec
fi


