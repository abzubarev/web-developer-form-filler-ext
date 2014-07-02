
(function ($) {
    $.fn.extend({
        deserialize: function (d, config) {
            var currentDom,
                $current = null,
                $currentSavedValue = null,
                $self = $(this),
                i = 0,
                keyValPairString = [],
                keyValPairObject = d,
                tmp;
            
            if (d === null || d === undefined) {
                return $self;
            }

            if (d.constructor === String) {
                d = decodeURIComponent(d.replace(/\+/g, " "));
                keyValPairString = d.split('&');

                for (i = 0; i < keyValPairString.length; i++) {
                    tmp = keyValPairString[i].split('=');
                    keyValPairObject[tmp[0]] = tmp[1];
                }
            }

            $self.find(":input").not('button, input[type=image], input[type=submit], input[type=hidden], input[type=button]')
			.each(function (index) {
                $current = $(this);
                currentDom = $current.get(0);
				
				if (!$current.attr("id") && !$current.attr("name")){
					return true;
				}	
				
                var name = $current.attr("id");
                name = (name) ? name : $current.attr("name");
				
                $currentSavedValue = keyValPairObject[name];

                if (currentDom.disabled === true) {
                    return true;
                }

                if ($current.is('textarea')) {
                    if ($currentSavedValue === undefined) {
                        console.error('Value for ' + name + ' not found');
                    } else {
                        $current.val($currentSavedValue);
                    }
                    $current.change();
                    return true;
                }

                if ($current.is('select')) {
                    if ($currentSavedValue === undefined) {
                        return true;
                    } else {
                        $current.val($currentSavedValue);
                        $current.change();
                    }
                    return true;
                }

                if ($current.is('input:radio')) {
                    if ($currentSavedValue !== undefined) {

                        $current.each(function () {
                            if ($(this).val() === $currentSavedValue) {
                                $(this).get(0).checked = true;
                                $(this).get(0).click();
                            }
                        });
                    }

                    return true;
                }

                if ($current.is('input:checkbox')) {
                    if ($currentSavedValue !== undefined) {
                        if (($current.val() === $currentSavedValue) || ($currentSavedValue === "true")) {
                            $(this).attr('checked', true);
                        } else {
                            $(this).attr('checked', false);
                        }
                        $(this).change();
                    }
                    return true;
                }

                if ($current.is('input:text, input:password, input[type=email], input[type=number], input[type=search], input[type=tel], input[type=url]')) {
                    if ($currentSavedValue === undefined) {
                        console.error('Value for ' + name + ' not found');
                    } else {
                        $current.val($currentSavedValue);
                        return true;
                    }
                    $current.change();

                }

            });

            return $self;
        }

    });

}(jQuery));
