%define distribution  rhel5
%define Name Scampi
%define lcName scampi
%define _prefix /usr/lib/%{lcName}

%define debug_package %{nil}

Summary: scampi - Listening and responding to events.
Name: scampi
Version: 0.1
Distribution:   Red Hat Enterprise Linux 5
Release: 1
License: Artistic
Group: Misc
URL: http://www.igs.umaryland.edu
Source: %{name}-%{version}.tar.gz
Packager: victor73@github
buildarch: noarch
Requires: nodejs

BuildRoot:      %{_builddir}/%{name}-%{version}-%{release}-root

%description
An extremely lightweight daemon that connects to a STOMP capable
messaging server, such as ActiveMQ, and responds to messages
in topics and queues by launching scripts and passing the message
content to them.

%prep
# unzips the source tarball/zip
%setup -n %{name}-%{version}

%build

%clean                                                                                 
[ "${RPM_BUILD_ROOT}" != "/" ] && %__rm -rf ${RPM_BUILD_ROOT}

%pre

%post
/sbin/chkconfig --add %{lcName}
/sbin/chkconfig --level 2345 %{lcName} on

%postun
# Check if this is the last uninstall
if [ "$1" = "0" ] ; then
  if [ -d %{_bindir}/%{name}-%{version} ]; then
    %__rm -rf %{_bindir}/%{name}-%{version}
  fi
  if [ -d %{_localstatedir}/%{name} ]; then
    %__rm -rf %{_localstatedir}/%{name}
  fi
fi

%install
mkdir -p ${RPM_BUILD_ROOT}/usr/bin/
mkdir -p ${RPM_BUILD_ROOT}/usr/lib/%{lcName}
%{__mkdir} -p ${RPM_BUILD_ROOT}/%{_sysconfdir}/%{lcName}
%{__mkdir} -p %{buildroot}/%{_sysconfdir}/init.d
%{__mkdir} -p %{buildroot}/%{_sysconfdir}/logrotate.d

%{__cp} %{lcName}.js ${RPM_BUILD_ROOT}/usr/bin/
%{__cp} rpm/init.sh %{buildroot}/%{_sysconfdir}/init.d/%{lcName}
%{__cp} rpm/logrotate.conf %{buildroot}%{_sysconfdir}/logrotate.d/%{lcName}
sed -i -e "s/@NAME@/%{lcName}/" %{buildroot}/%{_sysconfdir}/logrotate.d/%{lcName}
%{__cp} conf/config.ini ${RPM_BUILD_ROOT}/%{_sysconfdir}/%{lcName}
%{__cp} conf/listen.json ${RPM_BUILD_ROOT}/%{_sysconfdir}/%{lcName}
%{__cp} -r node_modules ${RPM_BUILD_ROOT}/usr/lib/%{lcName}

# Log directory
%__mkdir -p %{buildroot}%{_localstatedir}/log/%{lcName}

%files
%_prefix
%config(noreplace) /etc/%{lcName}/config.ini
%config(noreplace) /etc/%{lcName}/listen.json
%config(noreplace) /etc/logrotate.d/%{lcName}
/usr/bin/%{lcName}.js
# Startup script
%attr(755,root,root) %{_sysconfdir}/init.d/%{lcName}
# Logs
%dir %{_localstatedir}/log/%{lcName}

%changelog
* Sat Jul 21 2012 victor73@github
- Initial version
